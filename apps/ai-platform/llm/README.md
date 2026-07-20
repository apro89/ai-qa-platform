# LLM Provider Layer

## Overview

The LLM Provider Layer provides a **provider-independent interface** for communicating with Large Language Models. It abstracts away provider-specific implementations, allowing the system to support multiple LLM providers (OpenAI, Claude, Gemini, etc.) without changing business logic.

## Architecture

```
Business Logic
      ↓
  LLMService (Orchestration)
      ↓
  ProviderFactory (Registration & Discovery)
      ↓
  ILLMProvider (Interface)
      ↓
  ┌─────────────────────────────────┐
  ├─ OpenAIProvider (Current)       ├─ Future Providers
  ├─ ClaudeProvider (Future)        │  - GeminiProvider
  ├─ AzureOpenAIProvider (Future)   │  - OllamaProvider
  └─────────────────────────────────┘
      ↓
  RetryPolicy (Fault Tolerance)
      ↓
  RateLimiter (Flow Control)
      ↓
  LLM APIs
```

## Directory Structure

```
llm/
├── config/
│   └── LLMConfig.ts           - Configuration management
├── interfaces/
│   └── ILLMProvider.ts         - Provider contract
├── models/
│   ├── AIError.ts              - Error types
│   ├── AIResponse.ts           - Response model
│   └── AIUsage.ts              - Token tracking
├── providers/
│   └── OpenAIProvider.ts       - OpenAI implementation
├── services/
│   ├── LLMService.ts           - Main entry point
│   ├── ProviderFactory.ts      - Provider instantiation
│   ├── RateLimiter.ts          - Rate limiting
│   └── RetryPolicy.ts          - Retry logic
├── __tests__/
│   └── llm-provider.test.ts    - Unit tests
└── index.ts                     - Public API
```

## Usage

### Basic Usage

```typescript
import { LLMService, LLMConfig } from '@automation/llm/index.js';

// Create service with environment configuration
const service = new LLMService();

// Generate content
const response = await service.generate([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Write a test for login.' }
]);

console.log(response.content);
console.log(response.usage.totalTokens);
```

### Custom Configuration

```typescript
const config = new LLMConfig({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  timeout: 30000,
  retryCount: 3,
  maxRequestsPerMinute: 60,
});

const service = new LLMService({ config });
```

### Error Handling

```typescript
import { 
  LLMService, 
  RateLimitError, 
  AuthenticationError,
  TimeoutError,
  AIError 
} from '@automation/llm/index.js';

const service = new LLMService();

try {
  const response = await service.generate(messages);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof TimeoutError) {
    console.log('Request timed out');
  } else if (error instanceof AIError) {
    console.log(`Error: ${error.message}`);
  }
}
```

## Configuration

### Environment Variables

```bash
# Provider selection
LLM_PROVIDER=openai

# API Keys
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Model selection
OPENAI_MODEL=gpt-4o
CLAUDE_MODEL=claude-3-opus
GEMINI_MODEL=gemini-pro

# Endpoint (optional, for custom deployments)
OPENAI_BASE_URL=https://api.openai.com/v1

# Generation parameters
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
LLM_TOP_P=0.9
LLM_FREQUENCY_PENALTY=0
LLM_PRESENCE_PENALTY=0

# Timeout and retries
LLM_TIMEOUT=30000
LLM_RETRY_COUNT=3
LLM_RETRY_DELAY=1000

# Rate limiting
LLM_MAX_REQUESTS_PER_MINUTE=60
LLM_MAX_TOKENS_PER_MINUTE=90000
```

## Core Components

### 1. AIResponse

Provider-independent response model.

```typescript
interface AIResponse {
  content: string;              // Generated content
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    provider: string;
    model: string;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    createdAt: Date;
    requestId?: string;
  };
}

// Helpers
response.isComplete();          // true if finish_reason === 'stop'
response.isTruncated();        // true if finish_reason === 'length'
response.isFiltered();         // true if finish_reason === 'content_filter'
```

### 2. ILLMProvider

Contract that all providers must implement.

```typescript
interface ILLMProvider {
  generate(messages: PromptMessage[]): Promise<AIResponse>;
  healthCheck(): Promise<void>;
  getProviderName(): string;
  getModel(): string;
}
```

### 3. LLMService

Main entry point for generating content. Orchestrates:
- Provider selection via `ProviderFactory`
- Rate limiting via `RateLimiter`
- Retry logic via `RetryPolicy`
- Error mapping to `AIError` hierarchy

```typescript
const service = new LLMService({ config });
const response = await service.generate(messages, estimatedTokens);
```

### 4. ProviderFactory

Registry-based provider instantiation. Supports runtime provider registration.

```typescript
// Register custom provider
class MyProvider implements ILLMProvider { /* ... */ }
ProviderFactory.register('my-provider', MyProvider);

// Create instance
const provider = ProviderFactory.create(config);

// List available
const providers = ProviderFactory.getAvailableProviders();
```

### 5. RetryPolicy

Handles transient failures with exponential backoff.

**Retryable errors:**
- `RateLimitError` (429)
- `TimeoutError` 
- `NetworkError`

**Non-retryable errors:**
- `AuthenticationError` (401)
- `InvalidRequestError` (400)
- `ServerError` (5xx, unless timeout)

```typescript
const policy = new RetryPolicy({
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 60000,
});

await policy.execute(() => provider.generate(messages));
```

### 6. RateLimiter

Prevents exceeding provider rate limits.

```typescript
const limiter = new RateLimiter({
  maxRequestsPerMinute: 60,
  maxTokensPerMinute: 90000,
});

await limiter.checkLimit(estimatedTokens);  // Throws if limit exceeded
limiter.recordRequest(actualTokens);         // Track completed request
```

### 7. Error Hierarchy

```
AIError
├─ AuthenticationError      (401 - Not retryable)
├─ RateLimitError           (429 - Retryable with backoff)
├─ TimeoutError             (Timeout - Retryable)
├─ NetworkError             (Network issue - Retryable)
├─ InvalidRequestError      (400 - Not retryable)
├─ ServerError              (5xx - May be retryable)
└─ UnsupportedProviderError
```

All errors inherit from `AIError` and have:
```typescript
error.type: AIErrorType;              // Error category
error.provider: string;                // Which provider failed
error.statusCode?: number;             // HTTP status if applicable
error.originalError?: unknown;         // Original error object
error.isRetryable(): boolean;          // Retry recommendation
```

## Adding a New Provider

### 1. Create Provider Class

```typescript
// llm/providers/claude-provider.ts
import { ILLMProvider, PromptMessage } from '../interfaces/ILLMProvider.js';
import { AIResponse } from '../models/AIResponse.js';
import { LLMConfig } from '../config/LLMConfig.js';

export class ClaudeProvider implements ILLMProvider {
  constructor(private config: LLMConfig) {}

  async generate(messages: PromptMessage[]): Promise<AIResponse> {
    // Convert messages to Claude format
    // Call Claude API
    // Convert response to AIResponse
  }

  async healthCheck(): Promise<void> {
    // Verify Claude API is accessible
  }

  getProviderName(): string {
    return 'claude';
  }

  getModel(): string {
    return this.config.model;
  }
}
```

### 2. Register Provider

In `llm/services/ProviderFactory.ts`, add to static initializer:

```typescript
static {
  ProviderFactory.register('openai', OpenAIProvider);
  ProviderFactory.register('claude', ClaudeProvider);  // Add this
}
```

### 3. Update Configuration

Add to `LLMConfig.fromEnv()`:

```typescript
const model = process.env[`${provider.toUpperCase()}_MODEL`] || getDefaultModel(provider);
```

Add to `getDefaultModel()`:

```typescript
const defaults: Record<string, string> = {
  openai: 'gpt-4o',
  claude: 'claude-3-opus-20240229',  // Add this
  gemini: 'gemini-pro',
};
```

### 4. Update Exports

In `llm/index.ts`:

```typescript
export { ClaudeProvider } from './providers/ClaudeProvider.js';
```

### 5. Add Tests

Create `llm/__tests__/claude-provider.test.ts` and mock Claude API.

## Best Practices

### 1. Always Use LLMService

❌ **Bad:**
```typescript
const provider = new OpenAIProvider(config);
const response = await provider.generate(messages);
```

✅ **Good:**
```typescript
const service = new LLMService({ config });
const response = await service.generate(messages);
```

### 2. Handle Errors Appropriately

❌ **Bad:**
```typescript
try {
  const response = await service.generate(messages);
} catch (error) {
  console.log(error);  // Loses error context
}
```

✅ **Good:**
```typescript
try {
  const response = await service.generate(messages);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
  } else if (error instanceof AuthenticationError) {
    // Fix credentials
  } else {
    // Log and escalate
  }
}
```

### 3. Estimate Tokens Accurately

```typescript
// Provide accurate token estimates for rate limiting
const messages = [...];
const estimatedTokens = Math.ceil(JSON.stringify(messages).length / 4);
const response = await service.generate(messages, estimatedTokens);
```

### 4. Monitor Rate Limits

```typescript
const service = new LLMService();

// Before heavy operations
const stats = service.getRateLimiterStats();
if (stats.requestsInWindow > 50) {
  console.warn('Approaching rate limit');
}

// Reset after batch operations
service.resetRateLimiter();
```

## Testing

Run unit tests:

```bash
pnpm test --testPathPattern="llm"
```

Tests cover:
- ✅ AIResponse model
- ✅ LLMConfig validation
- ✅ ProviderFactory registration
- ✅ RetryPolicy backoff
- ✅ RateLimiter tracking
- ✅ Error mapping

All tests mock the OpenAI SDK and never call real APIs.

## Future Enhancements

### Phase 5 Extensions

1. **Additional Providers**
   - Claude Provider
   - Gemini Provider
   - Azure OpenAI Provider
   - Ollama (local models)

2. **Streaming Support**
   - Stream responses for long-running tasks
   - Support streaming errors

3. **Function Calling**
   - Tool/function calling support per provider
   - Normalized tool interface

4. **Caching**
   - Prompt caching (OpenAI API feature)
   - Response caching for identical requests

5. **Monitoring**
   - Token usage tracking per provider
   - Cost estimation
   - Latency metrics

6. **Batch Processing**
   - Batch API support (OpenAI)
   - Reduce costs for large operations

## Troubleshooting

### Authentication Error
```
Set OPENAI_API_KEY environment variable
```

### Rate Limited
```
The system will automatically retry with exponential backoff.
Adjust LLM_MAX_REQUESTS_PER_MINUTE and LLM_MAX_TOKENS_PER_MINUTE
```

### Timeout
```
Increase LLM_TIMEOUT (default: 30000ms)
```

### Invalid Configuration
```
Call config.validate() to check configuration before using
```

## Architecture Principles

### 1. **Dependency Inversion**
Business logic depends on `ILLMProvider`, not implementations.

### 2. **Provider Abstraction**
Each provider is isolated. Adding a new provider doesn't affect existing code.

### 3. **Error Abstraction**
Provider-specific errors are mapped to `AIError` hierarchy.

### 4. **Fault Tolerance**
Built-in retry and rate-limiting prevent cascading failures.

### 5. **Clean Architecture**
- **Interfaces:** Contracts (`ILLMProvider`)
- **Models:** Domain objects (`AIResponse`, `AIError`)
- **Services:** Orchestration (`LLMService`, `ProviderFactory`)
- **Config:** External configuration (`LLMConfig`)

## Related Documentation

- [Phase 4: Prompt Rendering Layer](../docs/ai-platform/PHASE_4_PROMPT_RENDERING_LAYER.md)
- [Architecture Overview](../docs/ai-platform/ARCHITECTURE_OVERVIEW.md)
- [Logger Documentation](../logger/README.md)
