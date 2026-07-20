/**
 * Ollama LLM Provider
 * Connects to local Ollama instance (https://ollama.ai)
 * 
 * Setup:
 * 1. Install Ollama: https://ollama.ai
 * 2. Run a model: ollama run mistral (or llama2, neural-chat, etc.)
 * 3. Ollama API runs on http://localhost:11434 by default
 */

import { ILLMProvider } from '../interfaces/ILLMProvider.js';
import { LLMConfig } from '../config/LLMConfig.js';
import { AIResponse } from '../models/AIResponse.js';
import { AIError, NetworkError, TimeoutError } from '../models/AIError.js';
import { TokenUsage } from '../models/AIUsage.js';
import { createLogger } from '../../logger/index.js';

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  temperature?: number;
  top_p?: number;
  num_predict?: number;
  stream?: boolean;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaProvider implements ILLMProvider {
  private logger = createLogger('OllamaProvider');
  private config: LLMConfig;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.logger.debug(`OllamaProvider initialized with base URL: ${this.baseUrl}`, {});
  }

  getProviderName(): string {
    return 'ollama';
  }

  getModel(): string {
    return this.config.model;
  }

  async healthCheck(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: this.config.timeout || 30000,
      });

      if (!response.ok) {
        throw new NetworkError(
          `Health check failed: ${response.statusText}`,
          'ollama',
        );
      }

      this.logger.debug('Ollama health check passed', {});
    } catch (error) {
      if (error instanceof Error) {
        throw new NetworkError(
          `Cannot connect to Ollama at ${this.baseUrl}: ${error.message}`,
          'ollama',
        );
      }
      throw error;
    }
  }

  async generate(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  ): Promise<AIResponse> {
    try {
      this.logger.debug('Generating response with Ollama', {
        model: this.config.model,
        messageCount: messages.length,
      });

      const request: OllamaRequest = {
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.maxTokens,
        stream: false,
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        timeout: this.config.timeout || 30000,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new AIError(
          'ollama_error',
          `Ollama API error: ${response.statusText} - ${error}`,
          'ollama',
        );
      }

      const data = (await response.json()) as OllamaResponse;

      // Estimate tokens (Ollama doesn't provide exact counts in response)
      const promptTokens = this.estimateTokens(
        messages.map((m) => m.content).join(' '),
      );
      const completionTokens = this.estimateTokens(data.message.content);

      const usage = new TokenUsage(promptTokens, completionTokens);

      const aiResponse = new AIResponse(data.message.content, usage, {
        provider: 'ollama',
        model: data.model,
        finishReason: data.done ? 'stop' : 'length',
        createdAt: new Date(data.created_at),
      });

      this.logger.debug('Response generated successfully', {
        contentLength: data.message.content.length,
        estimatedTokens: usage.totalTokens,
      });

      return aiResponse;
    } catch (error) {
      if (error instanceof AIError) {
        this.logger.error('Ollama API error', error);
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.logger.error('Ollama connection error', error);
        throw new NetworkError(
          `Failed to connect to Ollama at ${this.baseUrl}. Make sure Ollama is running (ollama serve)`,
          'ollama',
        );
      }

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          this.logger.error('Ollama timeout error', error);
          throw new TimeoutError(
            `Request to Ollama timed out after ${this.config.timeout}ms`,
            'ollama',
          );
        }

        this.logger.error('Ollama error', error);
        throw new AIError('ollama_error', error.message, 'ollama');
      }

      throw error;
    }
  }

  /**
   * Rough token estimation (1 token ≈ 4 characters)
   * Ollama doesn't return exact token counts, so we estimate
   */
  private estimateTokens(text: string): number {
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words * 1.3); // Average ~1.3 tokens per word
  }
}
