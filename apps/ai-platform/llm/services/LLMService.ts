/**
 * LLM Service
 * Main entry point for generating content with LLMs.
 * Orchestrates provider selection, rate limiting, retries, and error handling.
 * Business logic depends on this service, not on individual providers.
 */

import { ILLMProvider, PromptMessage } from '../interfaces/ILLMProvider.js';
import { AIResponse } from '../models/AIResponse.js';
import { AIError } from '../models/AIError.js';
import { LLMConfig } from '../config/LLMConfig.js';
import { ProviderFactory } from './ProviderFactory.js';
import { RetryPolicy, RetryPolicyOptions } from './RetryPolicy.js';
import { RateLimiter, RateLimiterOptions } from './RateLimiter.js';
import { createLogger } from '../../logger/index.js';

export interface LLMServiceOptions {
  config?: LLMConfig;
  retryPolicy?: RetryPolicyOptions;
  rateLimiter?: RateLimiterOptions;
}

export class LLMService {
  private logger = createLogger('LLMService');
  private provider: ILLMProvider;
  private config: LLMConfig;
  private retryPolicy: RetryPolicy;
  private rateLimiter: RateLimiter;

  constructor(options: LLMServiceOptions = {}) {
    this.config = options.config || LLMConfig.fromEnv();
    this.config.validate();

    this.provider = ProviderFactory.create(this.config);

    this.retryPolicy = new RetryPolicy(
      options.retryPolicy || {
        maxRetries: this.config.retryCount,
        initialDelayMs: this.config.retryDelayMs,
      },
    );

    this.rateLimiter = new RateLimiter(
      options.rateLimiter || {
        maxRequestsPerMinute: this.config.maxRequestsPerMinute,
        maxTokensPerMinute: this.config.maxTokensPerMinute,
      },
    );

    this.logger.info('LLMService initialized', {
      provider: this.config.provider,
      model: this.config.model,
      retryCount: this.config.retryCount,
      maxRequestsPerMinute: this.config.maxRequestsPerMinute,
    });
  }

  /**
   * Generate content from prompt messages
   * Handles rate limiting, retries, and error mapping
   */
  async generate(messages: PromptMessage[], estimatedTokens?: number): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Estimate tokens if not provided (rough estimate: 1 token ≈ 4 characters)
      const tokens = estimatedTokens || Math.ceil(JSON.stringify(messages).length / 4);

      // Check rate limits
      await this.rateLimiter.checkLimit(tokens);

      this.logger.debug('LLMService.generate', {
        messageCount: messages.length,
        provider: this.config.provider,
        model: this.config.model,
      });

      // Execute with retry policy
      const response = await this.retryPolicy.execute(
        () => this.provider.generate(messages),
        'LLM request',
      );

      // Record successful request
      this.rateLimiter.recordRequest(response.usage.totalTokens);

      const duration = Date.now() - startTime;
      this.logger.info('LLM generation completed', {
        provider: this.config.provider,
        model: this.config.model,
        duration,
        tokens: response.usage.totalTokens,
        finishReason: response.metadata.finishReason,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('LLM generation failed', {
        error: String(error),
        duration,
        provider: this.config.provider,
      });

      if (error instanceof AIError) {
        throw error;
      }

      throw new AIError(
        'unknown',
        error instanceof Error ? error.message : 'Unknown error',
        this.config.provider,
        undefined,
        error,
      );
    }
  }

  /**
   * Check provider health
   */
  async healthCheck(): Promise<void> {
    this.logger.debug('Performing health check', { provider: this.config.provider });

    try {
      await this.provider.healthCheck();
      this.logger.info('Health check passed', { provider: this.config.provider });
    } catch (error) {
      this.logger.error('Health check failed', {
        provider: this.config.provider,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Get current provider
   */
  getProvider(): ILLMProvider {
    return this.provider;
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return this.config;
  }

  /**
   * Get rate limiter stats
   */
  getRateLimiterStats() {
    return this.rateLimiter.getStats();
  }

  /**
   * Reset rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
    this.logger.debug('Rate limiter reset');
  }
}
