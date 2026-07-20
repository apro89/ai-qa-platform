/**
 * LLM configuration loaded from environment variables.
 * Provider-independent configuration model.
 */

import { createLogger } from '../../logger/index.js';

export interface LLMConfigOptions {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
  retryCount?: number;
  retryDelayMs?: number;
  maxRequestsPerMinute?: number;
  maxTokensPerMinute?: number;
}

export class LLMConfig {
  private logger = createLogger('LLMConfig');

  readonly provider: string;
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly topP?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
  readonly timeout: number;
  readonly retryCount: number;
  readonly retryDelayMs: number;
  readonly maxRequestsPerMinute: number;
  readonly maxTokensPerMinute: number;

  constructor(options: LLMConfigOptions) {
    this.provider = options.provider;
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = options.baseUrl;
    this.temperature = options.temperature ?? 0.7;
    this.maxTokens = options.maxTokens ?? 2048;
    this.topP = options.topP;
    this.frequencyPenalty = options.frequencyPenalty;
    this.presencePenalty = options.presencePenalty;
    this.timeout = options.timeout ?? 30000;
    this.retryCount = options.retryCount ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.maxRequestsPerMinute = options.maxRequestsPerMinute ?? 60;
    this.maxTokensPerMinute = options.maxTokensPerMinute ?? 90000;
  }

  /**
   * Load configuration from environment variables
   */
  static fromEnv(): LLMConfig {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

    if (!apiKey) {
      throw new Error(
        `API key not found. Set ${provider.toUpperCase()}_API_KEY environment variable.`,
      );
    }

    const model = process.env[`${provider.toUpperCase()}_MODEL`] || getDefaultModel(provider);

    return new LLMConfig({
      provider,
      apiKey,
      model,
      baseUrl: process.env[`${provider.toUpperCase()}_BASE_URL`],
      temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : 0.7,
      maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS) : 2048,
      topP: process.env.LLM_TOP_P ? parseFloat(process.env.LLM_TOP_P) : undefined,
      frequencyPenalty: process.env.LLM_FREQUENCY_PENALTY
        ? parseFloat(process.env.LLM_FREQUENCY_PENALTY)
        : undefined,
      presencePenalty: process.env.LLM_PRESENCE_PENALTY
        ? parseFloat(process.env.LLM_PRESENCE_PENALTY)
        : undefined,
      timeout: process.env.LLM_TIMEOUT ? parseInt(process.env.LLM_TIMEOUT) : 30000,
      retryCount: process.env.LLM_RETRY_COUNT ? parseInt(process.env.LLM_RETRY_COUNT) : 3,
      retryDelayMs: process.env.LLM_RETRY_DELAY ? parseInt(process.env.LLM_RETRY_DELAY) : 1000,
      maxRequestsPerMinute: process.env.LLM_MAX_REQUESTS_PER_MINUTE
        ? parseInt(process.env.LLM_MAX_REQUESTS_PER_MINUTE)
        : 60,
      maxTokensPerMinute: process.env.LLM_MAX_TOKENS_PER_MINUTE
        ? parseInt(process.env.LLM_MAX_TOKENS_PER_MINUTE)
        : 90000,
    });
  }

  /**
   * Validate configuration
   */
  validate(): void {
    if (!this.provider) {
      throw new Error('Provider is required');
    }
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    if (!this.model) {
      throw new Error('Model is required');
    }
    if (this.temperature < 0 || this.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    if (this.maxTokens < 1 || this.maxTokens > 128000) {
      throw new Error('Max tokens must be between 1 and 128000');
    }
  }

  /**
   * Get configuration as object (excluding sensitive data)
   */
  toSafeJSON() {
    return {
      provider: this.provider,
      model: this.model,
      baseUrl: this.baseUrl,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      topP: this.topP,
      frequencyPenalty: this.frequencyPenalty,
      presencePenalty: this.presencePenalty,
      timeout: this.timeout,
      retryCount: this.retryCount,
      retryDelayMs: this.retryDelayMs,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      maxTokensPerMinute: this.maxTokensPerMinute,
    };
  }
}

function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o',
    claude: 'claude-3-opus-20240229',
    gemini: 'gemini-pro',
  };
  return defaults[provider] || 'gpt-4o';
}
