/**
 * Provider Factory
 * Creates and configures LLM provider instances.
 * Enables registration of new providers without modifying core code.
 */

import { ILLMProvider } from '../interfaces/ILLMProvider.js';
import { LLMConfig } from '../config/LLMConfig.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { UnsupportedProviderError } from '../models/AIError.js';
import { createLogger } from '../../logger/index.js';

type ProviderConstructor = new (config: LLMConfig) => ILLMProvider;

export class ProviderFactory {
  private static logger = createLogger('ProviderFactory');
  private static providerRegistry = new Map<string, ProviderConstructor>();

  static {
    // Register built-in providers
    ProviderFactory.register('openai', OpenAIProvider);
    ProviderFactory.register('ollama', OllamaProvider);
  }

  /**
   * Register a new provider
   */
  static register(name: string, providerClass: ProviderConstructor): void {
    ProviderFactory.logger.debug(`Registering provider: ${name}`);
    ProviderFactory.providerRegistry.set(name.toLowerCase(), providerClass);
  }

  /**
   * Create a provider instance
   */
  static create(config: LLMConfig): ILLMProvider {
    const providerName = config.provider.toLowerCase();
    const ProviderClass = ProviderFactory.providerRegistry.get(providerName);

    if (!ProviderClass) {
      ProviderFactory.logger.error(`Provider not found: ${providerName}`, {
        availableProviders: Array.from(ProviderFactory.providerRegistry.keys()),
      });
      throw new UnsupportedProviderError(config.provider);
    }

    ProviderFactory.logger.info(`Creating provider instance: ${providerName}`, {
      model: config.model,
    });

    return new ProviderClass(config);
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    return Array.from(ProviderFactory.providerRegistry.keys());
  }

  /**
   * Check if provider is registered
   */
  static isProviderSupported(name: string): boolean {
    return ProviderFactory.providerRegistry.has(name.toLowerCase());
  }
}
