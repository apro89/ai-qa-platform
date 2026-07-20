/**
 * Phase 5 Demo: LLM Provider Layer
 *
 * This demo shows how the LLM Provider Layer works with the PromptRenderer (Phase 4)
 * to create a complete prompt generation and LLM execution pipeline.
 *
 * Run with OpenAI:
 *   export OPENAI_API_KEY=sk-your-key
 *   pnpm exec ts-node apps/ai-platform/phase5-demo.ts
 *
 * Run with Ollama (local, free):
 *   ollama run mistral
 *   export LLM_PROVIDER=ollama
 *   pnpm exec ts-node apps/ai-platform/phase5-demo.ts
 */

import { LLMService, LLMConfig } from './llm/index.js';
import { createLogger } from './logger/index.js';

const logger = createLogger('Phase5Demo');

const selectedProvider = process.env.LLM_PROVIDER || 'openai';

async function demonstrateLLMLayer(): Promise<void> {
  logger.info('='.repeat(60));
  logger.info('Phase 5: LLM Provider Layer Demo');
  logger.info('='.repeat(60));

  try {
    // 1. Create LLM configuration
    logger.info('\n1. Creating LLM Configuration');
    logger.info('Selected provider:', { provider: selectedProvider });

    const config =
      selectedProvider === 'ollama'
        ? new LLMConfig({
            provider: 'ollama',
            apiKey: 'not-required-for-ollama',
            model: process.env.OLLAMA_MODEL || 'mistral',
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            temperature: 0.7,
            maxTokens: 1024,
            timeout: 60000,
          })
        : new LLMConfig({
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY || 'sk-demo',
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            temperature: 0.7,
            maxTokens: 1024,
            timeout: 30000,
            retryCount: 2,
            maxRequestsPerMinute: 60,
          });

    logger.info('Configuration loaded:', { config: config.toSafeJSON() });

    // 2. Create LLM Service
    logger.info('\n2. Creating LLM Service');
    const service = new LLMService({ config });
    logger.info('Service initialized with provider:', { provider: service.getConfig().provider });

    // 3. Prepare prompt messages (as if from Phase 4 PromptRenderer)
    logger.info('\n3. Preparing Prompt Messages (from Phase 4)');
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert QA automation engineer.
Your task is to generate a Playwright test.
Follow the Screenplay Pattern.
Keep tests business-focused, not technical.`,
      },
      {
        role: 'user' as const,
        content: `Write a test that verifies a user can:
1. Navigate to the login page
2. Enter valid credentials
3. Click the login button
4. See the dashboard

Use the Screenplay Pattern with:
- Actors
- Abilities
- Tasks
- Questions`,
      },
    ];

    logger.info('Messages prepared:');
    messages.forEach((msg, idx) => {
      logger.info(`  Message ${idx + 1}: role=${msg.role}, length=${msg.content.length}`, {
        role: msg.role,
        length: msg.content.length,
      });
    });

    // 4. Generate response (with error handling)
    logger.info('\n4. Generating Response (if API key is configured)');
    logger.info('Current rate limiter stats:', { stats: service.getRateLimiterStats() });

    const shouldSkipCall = selectedProvider === 'openai' && config.apiKey === 'sk-demo';

    if (!shouldSkipCall) {
      try {
        logger.info('Making LLM request...');
        const response = await service.generate(messages);

        logger.info('\n5. Response Received');
        logger.info('Provider:', { provider: response.metadata.provider });
        logger.info('Model:', { model: response.metadata.model });
        logger.info('Finish reason:', { finishReason: response.metadata.finishReason });
        logger.info('Complete:', { isComplete: response.isComplete() });
        logger.info('Token usage:', {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
        });

        logger.info('Generated Content (first 500 chars):', {
          content: response.content.substring(0, 500) + '...',
        });
      } catch (error) {
        logger.warn('LLM request failed', {});
        if (selectedProvider === 'ollama') {
          logger.info('Make sure Ollama is running:', { command: 'ollama serve' });
          logger.info('Then run a model:', { command: 'ollama run mistral' });
        } else {
          logger.info('Make sure you have a valid OpenAI API key', {
            hint: 'export OPENAI_API_KEY=sk-...',
          });
        }
        if (error instanceof Error) {
          logger.info('Error type:', { type: error.constructor.name });
          logger.info('Error message:', { message: error.message });
        } else {
          logger.info('Error caught:', { errorType: typeof error, error: String(error) });
        }
      }
    } else {
      logger.info('Demo API key detected. Skipping actual LLM call.', {});
      logger.info('To test with OpenAI, set OPENAI_API_KEY environment variable.', {});
      logger.info('To test with Ollama, set LLM_PROVIDER=ollama', {});
    }

    // 5. Rate limiter information
    logger.info('Rate Limiter Configuration', {});
    const config_ = service.getConfig();
    logger.info('Max requests per minute:', { maxRequestsPerMinute: config_.maxRequestsPerMinute });
    logger.info('Max tokens per minute:', { maxTokensPerMinute: config_.maxTokensPerMinute });

    // 6. Provider information
    logger.info('Provider Information', {});
    const provider = service.getProvider();
    logger.info('Provider name:', { providerName: provider.getProviderName() });
    logger.info('Model:', { model: provider.getModel() });

    logger.info('Demo Complete', {});

    logger.info('Phase 5 Architecture', {
      architecture: `
ProjectAnalyzer
        ↓
ProjectContext
        ↓
AIRequestBuilder
        ↓
PromptRenderer (Phase 4)
        ↓
PromptMessages
        ↓
LLMService ← You are here (Phase 5)
        ↓
ProviderFactory
        ↓
ILLMProvider
        ├─ OpenAIProvider (✅ Implemented)
        ├─ OllamaProvider (✅ Implemented - Local, Free!)
        ├─ ClaudeProvider (Future)
        ├─ GeminiProvider (Future)
        └─ AzureOpenAIProvider (Future)
        ↓
AIResponse

Provider-Independent Design:
- Business logic depends on ILLMProvider interface
- Adding new providers requires no changes to existing code
- Retry and rate limiting work with all providers
- Error handling is provider-agnostic

Currently running: ${selectedProvider.toUpperCase()}
    `,
    });

    logger.info('Key Files:', {
      files: [
        'llm/config/LLMConfig.ts - Configuration management',
        'llm/interfaces/ILLMProvider.ts - Provider contract',
        'llm/services/LLMService.ts - Main entry point',
        'llm/services/ProviderFactory.ts - Provider registry',
        'llm/providers/OpenAIProvider.ts - OpenAI implementation',
        'llm/services/RetryPolicy.ts - Retry logic',
        'llm/services/RateLimiter.ts - Rate limiting',
        'llm/README.md - Complete documentation',
      ],
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Demo failed:', err);
    process.exit(1);
  }
}

// Run demo
demonstrateLLMLayer().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Fatal error:', err);
  process.exit(1);
});
