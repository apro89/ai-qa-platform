/**
 * OpenAI LLM Provider Implementation
 * Converts between platform-neutral and OpenAI-specific formats.
 * Handles API communication, error mapping, and response conversion.
 */

import { ILLMProvider, PromptMessage } from '../interfaces/ILLMProvider.js';
import { AIResponse } from '../models/AIResponse.js';
import { AIUsage, TokenUsage } from '../models/AIUsage.js';
import {
  AIError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  NetworkError,
  ServerError,
  InvalidRequestError,
} from '../models/AIError.js';
import { LLMConfig } from '../config/LLMConfig.js';
import { createLogger } from '../../logger/index.js';

export interface OpenAIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  [key: string]: any;
}

export class OpenAIProvider implements ILLMProvider {
  private logger = createLogger('OpenAIProvider');
  private readonly config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate content using OpenAI API
   * Note: Uses node-fetch for runtime compatibility. In production,
   * replace with `import OpenAI from 'openai'` and use the official SDK.
   */
  async generate(messages: PromptMessage[], options?: OpenAIRequestOptions): Promise<AIResponse> {
    try {
      this.logger.debug('Generating response from OpenAI', {
        model: this.config.model,
        messageCount: messages.length,
      });

      const requestPayload = this.buildRequest(messages, options);
      const response = await this.callOpenAIAPI(requestPayload);
      const usage = TokenUsage.fromOpenAI(response);
      const aiResponse = AIResponse.fromOpenAI(response, this.config.model, usage);

      this.logger.info('OpenAI request completed', {
        model: this.config.model,
        tokens: usage.totalTokens,
        finishReason: aiResponse.metadata.finishReason,
      });

      return aiResponse;
    } catch (error) {
      this.logger.error('OpenAI API error', { error: String(error) });
      throw this.mapError(error);
    }
  }

  /**
   * Check OpenAI API health
   */
  async healthCheck(): Promise<void> {
    try {
      this.logger.debug('Performing health check on OpenAI');

      const requestPayload = this.buildRequest([{ role: 'user', content: 'ping' }]);
      await this.callOpenAIAPI(requestPayload);

      this.logger.info('OpenAI health check passed');
    } catch (error) {
      this.logger.error('OpenAI health check failed', { error: String(error) });
      throw this.mapError(error);
    }
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'openai';
  }

  /**
   * Get configured model
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Build OpenAI API request payload
   */
  private buildRequest(
    messages: PromptMessage[],
    options?: OpenAIRequestOptions,
  ): Record<string, any> {
    return {
      model: this.config.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      ...(this.config.topP && { top_p: options?.topP ?? this.config.topP }),
      ...(this.config.frequencyPenalty && {
        frequency_penalty: options?.frequencyPenalty ?? this.config.frequencyPenalty,
      }),
      ...(this.config.presencePenalty && {
        presence_penalty: options?.presencePenalty ?? this.config.presencePenalty,
      }),
    };
  }

  /**
   * Call OpenAI API with timeout
   * Note: In production, use the official OpenAI SDK
   */
  private async callOpenAIAPI(payload: Record<string, any>): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Placeholder for actual API call
      // In production: import OpenAI from 'openai'; const client = new OpenAI(...)
      // return client.chat.completions.create(payload)

      // For demonstration, we'll check if fetch is available
      if (typeof global !== 'undefined' && !global.fetch) {
        throw new Error('fetch is not available in this environment');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal as any,
      } as any);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${this.config.timeout}ms`, 'openai', error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: any): Promise<never> {
    const body = await response.json().catch(() => ({}));
    const errorMessage = body.error?.message || `HTTP ${response.status}`;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(`Authentication failed: ${errorMessage}`, 'openai', body);
      case 429:
        throw new RateLimitError(
          body.error?.retry_after,
          `Rate limited: ${errorMessage}`,
          'openai',
          body,
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(`Server error: ${errorMessage}`, 'openai', response.status, body);
      case 400:
        throw new InvalidRequestError(`Invalid request: ${errorMessage}`, 'openai', body);
      default:
        throw new AIError('unknown', `API error: ${errorMessage}`, 'openai', response.status, body);
    }
  }

  /**
   * Map errors to AIError types
   */
  private mapError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return new NetworkError(error.message, 'openai', error);
      }
      if (error.message.includes('timeout')) {
        return new TimeoutError(error.message, 'openai', error);
      }
      return new AIError('unknown', error.message, 'openai', undefined, error);
    }

    return new AIError('unknown', 'Unknown error', 'openai', undefined, error);
  }
}

// Polyfill TokenUsage.fromOpenAI if not already available
if (!TokenUsage.prototype.hasOwnProperty('fromOpenAI')) {
  Object.defineProperty(TokenUsage, 'fromOpenAI', {
    value: function (response: any): AIUsage {
      const usage = response.usage || {};
      return new TokenUsage(usage.prompt_tokens || 0, usage.completion_tokens || 0);
    },
  });
}
