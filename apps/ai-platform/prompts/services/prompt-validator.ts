/**
 * PromptValidator
 *
 * Validates prompts at different stages:
 * 1. Input validation (AIRequest is valid)
 * 2. Output validation (PromptMessages is complete and quality)
 */

import { createLogger } from '../../logger/index.js';
import type { AIRequest } from '../../ai/AIRequest.js';
import type { PromptMessages, EnhancedPromptMessages } from '../models/PromptMessages.js';
import { ValidationError } from '../errors/PromptRenderingError.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export class PromptValidator {
  private logger = createLogger('PromptValidator');

  /**
   * Validate AIRequest before rendering
   */
  validateAIRequest(request: AIRequest): void {
    const errors: string[] = [];

    if (!request.requestId) {
      errors.push('AIRequest must have requestId');
    }

    if (!request.templateType) {
      errors.push('AIRequest must have templateType');
    }

    if (!request.projectContext) {
      errors.push('AIRequest must have projectContext');
    }

    if (!request.userRequest || request.userRequest.trim().length === 0) {
      errors.push('AIRequest must have non-empty userRequest');
    }

    if (!request.systemInstructions || request.systemInstructions.length === 0) {
      errors.push('AIRequest must have systemInstructions');
    }

    if (errors.length > 0) {
      const message = `AIRequest validation failed: ${errors.join('; ')}`;
      this.logger.error(message);
      throw new ValidationError(message, { requestId: request.requestId, errors });
    }

    this.logger.debug(`AIRequest validation passed: ${request.requestId}`);
  }

  /**
   * Validate system prompt content
   */
  validateSystemPrompt(prompt: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    if (!prompt || prompt.trim().length === 0) {
      errors.push('System prompt cannot be empty');
      score = 0;
      return { valid: false, errors, warnings, score };
    }

    if (prompt.length < 100) {
      warnings.push('System prompt is very short, may lack sufficient instructions');
      score -= 20;
    }

    const hasRoleSection = prompt.toLowerCase().includes('role') || prompt.toLowerCase().includes('expert');
    if (!hasRoleSection) {
      warnings.push('Missing role/expertise definition');
      score -= 10;
    }

    const hasInstructionsSection = prompt.toLowerCase().includes('instruction') || prompt.toLowerCase().includes('follow');
    if (!hasInstructionsSection) {
      warnings.push('Missing clear instructions');
      score -= 10;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate user prompt content
   */
  validateUserPrompt(prompt: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    if (!prompt || prompt.trim().length === 0) {
      errors.push('User prompt cannot be empty');
      score = 0;
      return { valid: false, errors, warnings, score };
    }

    if (prompt.length < 50) {
      warnings.push('User prompt is very short, may lack sufficient context');
      score -= 20;
    }

    const hasQuestion = prompt.includes('?') || prompt.toLowerCase().includes('please') ||
      prompt.toLowerCase().includes('create') || prompt.toLowerCase().includes('generate');
    if (!hasQuestion) {
      warnings.push('User prompt may lack clear request/question');
      score -= 15;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate complete PromptMessages
   */
  validatePromptMessages(messages: PromptMessages): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const systemResult = this.validateSystemPrompt(messages.systemPrompt);
    if (!systemResult.valid) {
      errors.push(...systemResult.errors);
      score -= 30;
    } else {
      warnings.push(...systemResult.warnings);
      score -= systemResult.warnings.length * 5;
    }

    const userResult = this.validateUserPrompt(messages.userPrompt);
    if (!userResult.valid) {
      errors.push(...userResult.errors);
      score -= 30;
    } else {
      warnings.push(...userResult.warnings);
      score -= userResult.warnings.length * 5;
    }

    const duplicateLines = this.findDuplicateLines(
      messages.systemPrompt + '\n' + messages.userPrompt
    );
    if (duplicateLines > 0) {
      warnings.push(`Found ${duplicateLines} duplicate lines`);
      score -= 5;
    }

    if (!messages.metadata) {
      errors.push('PromptMessages must have metadata');
      score -= 10;
    }

    if (messages.metadata?.tokens) {
      const { totalTokens } = messages.metadata.tokens;
      if (totalTokens > 128000) {
        errors.push(`Token count (${totalTokens}) exceeds limit (128000)`);
        score -= 50;
      } else if (totalTokens > 100000) {
        warnings.push(`High token count (${totalTokens}), approaching limit`);
        score -= 10;
      }
    }

    if (messages.metadata) {
      messages.metadata.validation.qualityScore = Math.max(0, score);
      messages.metadata.validation.passed = errors.length === 0;
      messages.metadata.validation.warnings = warnings;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Find duplicate lines in text
   */
  private findDuplicateLines(text: string): number {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const seen = new Set<string>();
    let duplicates = 0;

    for (const line of lines) {
      const normalized = line.trim().toLowerCase();
      if (seen.has(normalized)) {
        duplicates++;
      }
      seen.add(normalized);
    }

    return duplicates;
  }

  /**
   * Calculate quality score (0-100) for enhanced messages
   */
  calculateQualityScore(messages: EnhancedPromptMessages): number {
    let score = 100;

    score -= messages.removedSections.length * 5;

    const totalSections = messages.systemPromptSectionCount + messages.userPromptSectionCount;
    if (totalSections < 5) {
      score -= 10;
    } else if (totalSections > 15) {
      score -= 5;
    }

    if (messages.compressedSections.length > 0) {
      const avgReduction = messages.compressedSections.reduce((sum, s) => sum + s.reductionPercent, 0) /
        messages.compressedSections.length;
      if (avgReduction > 50) {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }
}
