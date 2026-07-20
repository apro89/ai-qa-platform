/**
 * Rate limiter for controlling request frequency.
 * Prevents exceeding provider rate limits.
 */

import { RateLimitError } from '../models/AIError.js';
import { createLogger } from '../../logger/index.js';

export interface RateLimiterOptions {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
}

interface Request {
  timestamp: number;
  tokens: number;
}

export class RateLimiter {
  private logger = createLogger('RateLimiter');
  private readonly maxRequestsPerMinute: number;
  private readonly maxTokensPerMinute: number;
  private requestHistory: Request[] = [];

  constructor(options: RateLimiterOptions) {
    this.maxRequestsPerMinute = options.maxRequestsPerMinute;
    this.maxTokensPerMinute = options.maxTokensPerMinute;
  }

  /**
   * Check if a request can proceed or wait if needed
   */
  async checkLimit(estimatedTokens: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old requests
    this.requestHistory = this.requestHistory.filter((r) => r.timestamp > oneMinuteAgo);

    // Check request count
    if (this.requestHistory.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestHistory[0];
      const waitTime = oldestRequest.timestamp + 60000 - now;
      this.logger.warn(`Rate limit: requests per minute reached. Waiting ${waitTime}ms`);
      throw new RateLimitError(
        waitTime,
        `Request rate limit exceeded: ${this.requestHistory.length}/${this.maxRequestsPerMinute}`,
        'rate-limiter',
      );
    }

    // Check token count
    const tokensUsedInWindow = this.requestHistory.reduce((sum, r) => sum + r.tokens, 0);
    if (tokensUsedInWindow + estimatedTokens > this.maxTokensPerMinute) {
      const oldestRequest = this.requestHistory[0];
      const waitTime = oldestRequest.timestamp + 60000 - now;
      this.logger.warn(`Rate limit: tokens per minute reached. Waiting ${waitTime}ms`);
      throw new RateLimitError(
        waitTime,
        `Token rate limit would be exceeded: ${tokensUsedInWindow + estimatedTokens}/${this.maxTokensPerMinute}`,
        'rate-limiter',
      );
    }
  }

  /**
   * Record a completed request
   */
  recordRequest(tokens: number): void {
    this.requestHistory.push({
      timestamp: Date.now(),
      tokens,
    });
  }

  /**
   * Get current usage stats
   */
  getStats(): { requestsInWindow: number; tokensInWindow: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const activeRequests = this.requestHistory.filter((r) => r.timestamp > oneMinuteAgo);
    const tokensInWindow = activeRequests.reduce((sum, r) => sum + r.tokens, 0);

    return {
      requestsInWindow: activeRequests.length,
      tokensInWindow,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requestHistory = [];
  }
}
