/**
 * AIUsage - Token usage metrics from LLM provider
 *
 * Tracks tokens consumed by a request.
 * Provider-independent model.
 */

export interface AIUsage {
  /** Number of tokens in the prompt/input */
  promptTokens: number;

  /** Number of tokens in the completion/output */
  completionTokens: number;

  /** Total tokens used (promptTokens + completionTokens) */
  totalTokens: number;
}

export class TokenUsage implements AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  constructor(promptTokens: number, completionTokens: number) {
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.totalTokens = promptTokens + completionTokens;
  }

  /**
   * Calculate cost based on per-token pricing
   * @param promptPrice - Price per 1K prompt tokens
   * @param completionPrice - Price per 1K completion tokens
   * @returns Total cost in dollars
   */
  calculateCost(promptPrice: number, completionPrice: number): number {
    const promptCost = (this.promptTokens / 1000) * promptPrice;
    const completionCost = (this.completionTokens / 1000) * completionPrice;
    return promptCost + completionCost;
  }
}
