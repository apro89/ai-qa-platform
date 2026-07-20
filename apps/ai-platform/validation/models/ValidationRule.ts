import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationSeverity } from './ValidationSeverity.js';

/**
 * Represents a single validation rule violation.
 */
export interface ValidationRule {
  /**
   * Unique identifier for this rule.
   */
  ruleId: string;

  /**
   * Human-readable name of the rule.
   */
  ruleName: string;

  /**
   * Severity level of this violation.
   */
  severity: ValidationSeverity;

  /**
   * Detailed message describing the violation.
   */
  message: string;

  /**
   * File that triggered this rule (if applicable).
   */
  affectedFile?: GeneratedFile;

  /**
   * Line number in the affected file (if applicable).
   */
  lineNumber?: number;

  /**
   * Suggestions for fixing this violation.
   */
  suggestion?: string;

  /**
   * Category of the rule (e.g., 'naming', 'architecture', 'imports').
   */
  category: string;

  /**
   * Additional context data.
   */
  context?: Record<string, unknown>;
}

/**
 * Factory for creating validation rules.
 */
export class ValidationRuleFactory {
  static createError(
    ruleId: string,
    ruleName: string,
    message: string,
    category: string,
    suggestion?: string,
    affectedFile?: GeneratedFile,
    context?: Record<string, unknown>,
  ): ValidationRule {
    return {
      ruleId,
      ruleName,
      severity: 'error' as const,
      message,
      category,
      suggestion,
      affectedFile,
      context,
    };
  }

  static createWarning(
    ruleId: string,
    ruleName: string,
    message: string,
    category: string,
    suggestion?: string,
    affectedFile?: GeneratedFile,
    context?: Record<string, unknown>,
  ): ValidationRule {
    return {
      ruleId,
      ruleName,
      severity: 'warning' as const,
      message,
      category,
      suggestion,
      affectedFile,
      context,
    };
  }

  static createInfo(
    ruleId: string,
    ruleName: string,
    message: string,
    category: string,
    suggestion?: string,
    affectedFile?: GeneratedFile,
    context?: Record<string, unknown>,
  ): ValidationRule {
    return {
      ruleId,
      ruleName,
      severity: 'info' as const,
      message,
      category,
      suggestion,
      affectedFile,
      context,
    };
  }
}
