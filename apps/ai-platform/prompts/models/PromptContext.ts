/**
 * PromptContext
 *
 * Runtime context for building a prompt.
 * Contains the AIRequest data and rendering options.
 */

import type { AIRequest } from '../../ai/AIRequest.js';

export interface PromptContext {
  /** Original AIRequest from Phase 3 */
  aiRequest: AIRequest;

  /** Maximum tokens allowed for user prompt (after system prompt) */
  maxUserPromptTokens: number;

  /** Token budget for context sections */
  contextTokenBudget: number;

  /** Token budget for examples */
  examplesTokenBudget: number;

  /** Whether to include code examples */
  includeExamples: boolean;

  /** Whether to include architectural instructions */
  includeArchitecture: boolean;

  /** Whether to include naming conventions */
  includeNamingConventions: boolean;

  /** Whether to include coding style guidelines */
  includeCodingStyle: boolean;

  /** Whether to include reusable patterns */
  includeReusablePatterns: boolean;

  /** Timestamp when context was created */
  createdAt: Date;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Create a default PromptContext from an AIRequest
 */
export function createPromptContext(aiRequest: AIRequest): PromptContext {
  return {
    aiRequest,
    maxUserPromptTokens: 3000,
    contextTokenBudget: 1500,
    examplesTokenBudget: 800,
    includeExamples: true,
    includeArchitecture: true,
    includeNamingConventions: true,
    includeCodingStyle: true,
    includeReusablePatterns: true,
    createdAt: new Date(),
    metadata: {},
  };
}
