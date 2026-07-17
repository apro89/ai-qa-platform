/**
 * PromptMetadata
 *
 * Metadata about the generated prompt.
 * Includes template info, token counts, generation info, and quality metrics.
 */

export interface TokenBreakdown {
  /** Tokens in system prompt */
  systemPromptTokens: number;

  /** Tokens in user prompt */
  userPromptTokens: number;

  /** Total tokens (system + user) */
  totalTokens: number;

  /** Percentage of token budget used */
  budgetUtilization: number;

  /** Estimated tokens for LLM response */
  estimatedCompletionTokens: number;

  /** Total tokens including estimated response */
  estimatedTotalTokens: number;
}

export interface OptimizationMetrics {
  /** Sections removed due to token limits */
  sectionsRemoved: number;

  /** Examples removed due to token limits */
  examplesRemoved: number;

  /** Total token reduction achieved */
  tokenReduction: number;

  /** Percentage of token reduction */
  reductionPercentage: number;

  /** Whether optimization was successful */
  succeeded: boolean;
}

export interface ValidationMetrics {
  /** Overall quality score (0-100) */
  qualityScore: number;

  /** Completeness score (0-100) */
  completenessScore: number;

  /** Clarity score (0-100) */
  clarityScore: number;

  /** Consistency score (0-100) */
  consistencyScore: number;

  /** Any validation warnings */
  warnings: string[];

  /** Validation passed */
  passed: boolean;
}

export interface PromptMetadata {
  /** Unique identifier */
  id: string;

  /** Template type used */
  template: string;

  /** Template version */
  templateVersion: string;

  /** Timestamp when prompt was generated */
  generatedAt: Date;

  /** Time taken to render prompt (milliseconds) */
  renderingTimeMs: number;

  /** Token breakdown */
  tokens: TokenBreakdown;

  /** Optimization metrics */
  optimization: OptimizationMetrics;

  /** Validation metrics */
  validation: ValidationMetrics;

  /** Source AIRequest ID */
  aiRequestId: string;

  /** Framework used in project context */
  framework: string;

  /** Architecture pattern used */
  architecture: string;

  /** Environment where prompt was generated */
  environment: 'development' | 'staging' | 'production';

  /** Additional metadata */
  custom: Record<string, unknown>;
}

/**
 * Create default PromptMetadata
 */
export function createPromptMetadata(template: string, aiRequestId: string): PromptMetadata {
  return {
    id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    template,
    templateVersion: '1.0',
    generatedAt: new Date(),
    renderingTimeMs: 0,
    tokens: {
      systemPromptTokens: 0,
      userPromptTokens: 0,
      totalTokens: 0,
      budgetUtilization: 0,
      estimatedCompletionTokens: 0,
      estimatedTotalTokens: 0,
    },
    optimization: {
      sectionsRemoved: 0,
      examplesRemoved: 0,
      tokenReduction: 0,
      reductionPercentage: 0,
      succeeded: true,
    },
    validation: {
      qualityScore: 0,
      completenessScore: 0,
      clarityScore: 0,
      consistencyScore: 0,
      warnings: [],
      passed: false,
    },
    aiRequestId,
    framework: '',
    architecture: '',
    environment: 'development',
    custom: {},
  };
}
