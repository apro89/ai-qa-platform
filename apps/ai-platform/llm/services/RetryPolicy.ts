/**
 * Retry policy for handling transient failures.
 * Implements exponential backoff strategy.
 */

import { AIError, RateLimitError, TimeoutError, NetworkError } from '../models/AIError.js';
import { createLogger } from '../../logger/index.js';

export interface RetryPolicyOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export class RetryPolicy {
  private logger = createLogger('RetryPolicy');
  private readonly maxRetries: number;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly backoffMultiplier: number;

  constructor(options: RetryPolicyOptions) {
    this.maxRetries = options.maxRetries;
    this.initialDelayMs = options.initialDelayMs;
    this.maxDelayMs = options.maxDelayMs ?? 60000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    if (error instanceof AIError) {
      return error.isRetryable();
    }
    return false;
  }

  /**
   * Calculate delay for retry attempt
   */
  getDelayMs(attemptNumber: number): number {
    const delay = this.initialDelayMs * Math.pow(this.backoffMultiplier, attemptNumber);
    const jitter = Math.random() * (delay * 0.1); // 10% jitter
    const finalDelay = delay + jitter;
    return Math.min(finalDelay, this.maxDelayMs);
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(fn: () => Promise<T>, label?: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries && this.isRetryable(error)) {
          const delay = this.getDelayMs(attempt);
          this.logger.debug(
            `Retry attempt ${attempt + 1}/${this.maxRetries}${label ? ` for ${label}` : ''} after ${delay}ms`,
            { error: String(error) },
          );
          await this.delay(delay);
        } else {
          break;
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
