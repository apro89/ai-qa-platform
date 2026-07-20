/**
 * LLM Provider interface.
 * Defines the contract that all LLM providers must implement.
 * Enables provider-agnostic code while supporting multiple implementations.
 */

import { AIResponse } from '../models/AIResponse.js';
import { AIError } from '../models/AIError.js';

export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ILLMProvider {
  /**
   * Generate content from prompt messages
   * @param messages - Array of prompt messages
   * @param options - Provider-specific options
   * @throws AIError - On any error during generation
   */
  generate(messages: PromptMessage[], options?: Record<string, any>): Promise<AIResponse>;

  /**
   * Check provider health and connectivity
   * @throws AIError - If provider is unavailable
   */
  healthCheck(): Promise<void>;

  /**
   * Get the provider name
   */
  getProviderName(): string;

  /**
   * Get currently configured model
   */
  getModel(): string;
}
