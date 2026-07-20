# Phase 5: LLM Provider Layer

## Overview

Phase 5 implements the **LLM Provider Layer** - a unified interface for communicating with Large Language Models. This layer provides abstraction between business logic and LLM provider implementations, enabling multi-provider support (OpenAI, Claude, Gemini, etc.) without changing core code.

## Architecture

### Complete Platform Flow

```
ProjectAnalyzer (Phase 1)
        │ Scans project structure
        ↓
ProjectContext (Phase 2)
        │ Analyzes dependencies & patterns
        ↓
AIRequestBuilder (Phase 3)
        │ Creates request specification
        ↓
PromptRenderer (Phase 4)
        │ Renders PromptMessages from template
        ↓
PromptMessages
        │ Sequence of user/system/assistant messages
        ↓
╔═════════════════════════════════════════╗
║     LLMService (Phase 5) [NEW]         ║
║  - Orchestrates provider execution     ║
║  - Rate limiting                       ║
║  - Retry with exponential backoff      ║
║  - Error mapping to AIError            ║
╚═════════════════════════════════════════╝
        ↓
ProviderFactory
        │ Looks up registered provider
        ↓
ILLMProvider (Interface)
        │
   ┌────┴──────────────────────┐
   ↓                           ↓
OpenAIProvider             ClaudeProvider (Future)
(Uses OpenAI API)          (Uses Claude API)
   ↓                           ↓
   └────┬──────────────────────┘
        ↓
    AIResponse
        │ Provider-independent result
        │ - content: string
        │ - usage: { promptTokens, completionTokens }
        │ - metadata: { provider, model, finishReason }
        ↓
   Business Layer
```

## Component Breakdown

### 1. LLMService

**Purpose**: Main entry point for generating content. Orchestrates provider selection, rate limiting, retries, and error handling.

**Responsibilities**:
- Receive PromptMessages
- Select configured provider via ProviderFactory
- Check rate limits via RateLimiter
- Execute request with retry logic via RetryPolicy
- Map provider errors to AIError hierarchy
- Return provider-independent AIResponse

**Interface**:
```typescript
class LLMService {
  async generate(messages: PromptMessage[], estimatedTokens?: number): Promise<AIResponse>
  async healthCheck(): Promise<void>
  getProvider(): ILLMProvider
  getConfig(): LLMConfig
  getRateLimiterStats()
  resetRateLimiter(): void
}
```

### 2. ProviderFactory

**Purpose**: Creates and manages LLM provider instances. Uses registry pattern for extensibility.

**Key Features**:
- Static provider registry
- Built-in OpenAI registration
- `register(name, ProviderClass)` for runtime registration
- `create(config)` to instantiate providers
- `getAvailableProviders()` to list registered providers

**Why This Pattern**:
- No provider hardcoding
- Future providers need only registration
- No changes to existing code when adding providers
- Dependency Inversion: depends on ILLMProvider interface

### 3. ILLMProvider Interface

**Purpose**: Contract that all LLM providers must implement.

**Methods**:
```typescript
interface ILLMProvider {
  generate(messages: PromptMessage[], options?: any): Promise<AIResponse>
  healthCheck(): Promise<void>
  getProviderName(): string
  getModel(): string
}
```

**Implementation Requirement**: Every provider converts platform-neutral formats to/from provider-specific formats.

### 4. OpenAIProvider

**Purpose**: OpenAI API integration.

**Responsibilities**:
- Convert PromptMessage[] → OpenAI request format
- Add OpenAI-specific parameters (temperature, max_tokens, etc.)
- Call OpenAI API with timeout handling
- Map OpenAI responses to AIResponse
- Map OpenAI errors to AIError hierarchy

**Error Mapping**:
```
OpenAI 401 → AuthenticationError
OpenAI 429 → RateLimitError
OpenAI 400 → InvalidRequestError
OpenAI 5xx → ServerError
Network   → NetworkError
Timeout   → TimeoutError
```

### 5. RetryPolicy

**Purpose**: Handles transient failures with intelligent retry logic.

**Strategy**:
- Exponential backoff: delay = initialDelay × (backoffMultiplier ^ attemptNumber)
- Jitter: adds 10% random variance to prevent thundering herd
- Retryable only for: RateLimitError, TimeoutError, NetworkError
- Non-retryable: AuthenticationError, InvalidRequestError, etc.

**Example**:
```
Attempt 1: Wait ~1s
Attempt 2: Wait ~2s
Attempt 3: Wait ~4s
Max delay: configurable (default 60s)
```

### 6. RateLimiter

**Purpose**: Prevents exceeding provider rate limits.

**Tracks**:
- Requests per minute
- Tokens per minute
- Sliding window (last 60 seconds)

**Behavior**:
- Throws RateLimitError if limits would be exceeded
- Tracks successful requests for accurate limiting
- Can be reset for batch operations

### 7. LLMConfig

**Purpose**: Configuration management from environment variables.

**Supports**:
- Provider selection
- API keys for multiple providers
- Model selection per provider
- Generation parameters (temperature, max_tokens, etc.)
- Timeout and retry settings
- Rate limit thresholds

**Loading**:
```typescript
// From environment
const config = LLMConfig.fromEnv()

// Or explicit
const config = new LLMConfig({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o',
  // ... other settings
})
```

### 8. Error Hierarchy

```
AIError (base)
├─ AuthenticationError (401)
├─ RateLimitError (429)
├─ TimeoutError
├─ NetworkError
├─ InvalidRequestError (400)
├─ ServerError (5xx)
└─ UnsupportedProviderError
```

All errors include:
- `type`: Error category
- `provider`: Which provider failed
- `statusCode`: HTTP status if applicable
- `originalError`: Original provider error
- `isRetryable()`: Whether error should be retried

### 9. AIResponse

**Purpose**: Provider-independent response model.

**Structure**:
```typescript
class AIResponse {
  content: string              // Generated text
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  metadata: {
    provider: string           // 'openai', 'claude', etc.
    model: string
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter'
    createdAt: Date
    requestId?: string
  }

  // Helpers
  isComplete(): boolean        // finish_reason === 'stop'
  isTruncated(): boolean       // finish_reason === 'length'
  isFiltered(): boolean        // finish_reason === 'content_filter'
}
```

## Usage Example

```typescript
import { LLMService, LLMConfig } from '@automation/llm/index.js';

// From environment
const service = new LLMService();

// Or with explicit config
const config = new LLMConfig({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
});
const service = new LLMService({ config });

// Generate content
const response = await service.generate([
  { role: 'system', content: 'You are a QA expert.' },
  { role: 'user', content: 'Write a login test.' }
]);

console.log(response.content);
console.log(response.usage.totalTokens);
console.log(response.metadata.finishReason);
```

## Extensibility: Adding Claude Provider

### Step 1: Create Provider Class

```typescript
// llm/providers/claude-provider.ts
export class ClaudeProvider implements ILLMProvider {
  constructor(private config: LLMConfig) {}

  async generate(messages: PromptMessage[]): Promise<AIResponse> {
    // Convert to Claude format
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

### Step 2: Register in Factory

```typescript
// llm/services/ProviderFactory.ts
static {
  ProviderFactory.register('openai', OpenAIProvider);
  ProviderFactory.register('claude', ClaudeProvider);  // Add this
}
```

### Step 3: Update Configuration

```typescript
// llm/config/LLMConfig.ts
function getDefaultModel(provider: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o',
    claude: 'claude-3-opus-20240229',  // Add this
  };
  return defaults[provider] || 'gpt-4o';
}
```

### Step 4: Use It

```typescript
process.env.LLM_PROVIDER = 'claude';
process.env.CLAUDE_API_KEY = 'sk-ant-...';
const service = new LLMService();
// Works transparently!
```

## Configuration Reference

### Environment Variables

```bash
# Provider
LLM_PROVIDER=openai

# API Keys
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Models
OPENAI_MODEL=gpt-4o
CLAUDE_MODEL=claude-3-opus-20240229

# Custom endpoints
OPENAI_BASE_URL=https://api.openai.com/v1

# Generation
LLM_TEMPERATURE=0.7          # 0-2
LLM_MAX_TOKENS=2048          # 1-128000
LLM_TOP_P=0.9
LLM_FREQUENCY_PENALTY=0      # -2 to 2
LLM_PRESENCE_PENALTY=0       # -2 to 2

# Timeout & retries
LLM_TIMEOUT=30000
LLM_RETRY_COUNT=3
LLM_RETRY_DELAY=1000

# Rate limiting
LLM_MAX_REQUESTS_PER_MINUTE=60
LLM_MAX_TOKENS_PER_MINUTE=90000
```

## Testing Strategy

All tests mock the LLM provider. No real API calls in tests.

```typescript
// Mock OpenAI response
const mockResponse = {
  id: 'chatcmpl-...',
  choices: [{
    message: { content: 'Mocked response' },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150
  },
  created: Math.floor(Date.now() / 1000)
};

// Mock fetch or SDK
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(mockResponse)
      }
    }
  }))
}));
```

## Design Principles

### 1. Dependency Inversion
Business logic depends on `ILLMProvider` interface, not concrete implementations. This allows swapping providers without code changes.

### 2. Single Responsibility
Each class has one reason to change:
- `LLMService`: Orchestration
- `RetryPolicy`: Retry logic
- `RateLimiter`: Rate limiting
- `OpenAIProvider`: OpenAI API communication

### 3. Open/Closed Principle
- **Open for extension**: Register new providers in ProviderFactory
- **Closed for modification**: No changes to existing code

### 4. Liskov Substitution
All providers implement the same `ILLMProvider` contract and can be used interchangeably.

### 5. Interface Segregation
`ILLMProvider` has only essential methods: `generate()`, `healthCheck()`, `getProviderName()`, `getModel()`

## Fault Tolerance

### Retry Strategy
- Exponential backoff for transient failures
- 10% jitter to prevent thundering herd
- Configurable retry count (default: 3)
- Non-retryable errors fail immediately

### Rate Limiting
- Tracks requests per minute
- Tracks tokens per minute
- Prevents exceeding provider limits
- Sliding window calculation

### Timeout Handling
- Configurable timeout per request (default: 30s)
- AbortController for cancellation
- Automatic cleanup

### Error Categories

| Error Type | Retryable | Handling |
|-----------|-----------|----------|
| RateLimitError | ✅ | Exponential backoff |
| TimeoutError | ✅ | Exponential backoff |
| NetworkError | ✅ | Exponential backoff |
| AuthenticationError | ❌ | Fail immediately |
| InvalidRequestError | ❌ | Fail immediately |
| ServerError | ⚠️ | May retry on 5xx |

## Logging

The LLM layer integrates with centralized logging:

```typescript
// Per-component loggers
Logger.getLogger('LLMService')
Logger.getLogger('OpenAIProvider')
Logger.getLogger('ProviderFactory')
Logger.getLogger('RetryPolicy')
Logger.getLogger('RateLimiter')

// Logged events
- Provider initialization
- Request start/completion
- Token usage
- Retry attempts
- Rate limit status
- Errors with context
```

## Performance Considerations

### Token Estimation
- Default: `Math.ceil(JSON.stringify(messages).length / 4)`
- Override with explicit `estimatedTokens` parameter
- Improves rate limiter accuracy

### Rate Limit Defaults
- 60 requests/minute (typical for GPT-4)
- 90,000 tokens/minute (typical for GPT-4)
- Configurable per provider

### Timeout
- Default: 30 seconds
- Longer for large contexts (consider 60s for 4K+ tokens)

## Security

### API Key Protection
- Loaded from environment variables only
- Never logged or exposed
- `config.toSafeJSON()` excludes API key

### Request/Response Handling
- No sensitive data logged
- Original provider errors sanitized
- Error messages don't expose credentials

## Integration Points

### With PromptRenderer (Phase 4)
```typescript
// Phase 4 generates messages
const messages = promptRenderer.render(context, task);

// Phase 5 executes them
const response = await llmService.generate(messages);
```

### With Test Generation (Future)
```typescript
// Generate test from response
const test = testGenerator.generate(response.content);
```

## Files

| File | Purpose |
|------|---------|
| `llm/index.ts` | Public API exports |
| `llm/config/LLMConfig.ts` | Configuration management |
| `llm/interfaces/ILLMProvider.ts` | Provider contract |
| `llm/models/AIError.ts` | Error types |
| `llm/models/AIResponse.ts` | Response model |
| `llm/models/AIUsage.ts` | Token tracking |
| `llm/providers/OpenAIProvider.ts` | OpenAI implementation |
| `llm/services/LLMService.ts` | Main orchestrator |
| `llm/services/ProviderFactory.ts` | Provider registry |
| `llm/services/RetryPolicy.ts` | Retry logic |
| `llm/services/RateLimiter.ts` | Rate limiting |
| `llm/__tests__/llm-provider.test.ts` | Unit tests |
| `llm/README.md` | Implementation guide |
| `phase5-demo.ts` | Usage demonstration |

## Future Enhancements

### Phase 5 Extensions (Not Yet Implemented)
1. **Additional Providers**
   - Claude Provider
   - Gemini Provider
   - Azure OpenAI Provider
   - Ollama (local models)

2. **Streaming Support**
   - Stream responses for long-running tasks
   - Streaming errors

3. **Tool Calling**
   - Function calling per provider
   - Normalized tool interface

4. **Caching**
   - Prompt caching (OpenAI feature)
   - Response caching

5. **Monitoring**
   - Token usage per provider
   - Cost estimation
   - Latency metrics

6. **Batch Processing**
   - Batch API support (OpenAI)
   - Cost optimization for large operations

## Troubleshooting

### "API key not found"
```bash
export OPENAI_API_KEY=sk-...
# or
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-...
```

### "Rate limited"
The system will automatically retry with exponential backoff. If rate limits persist, reduce `LLM_MAX_REQUESTS_PER_MINUTE`.

### "Timeout"
Increase `LLM_TIMEOUT` environment variable (in milliseconds).

### "Unsupported provider"
Check `LLM_PROVIDER` environment variable and ensure provider is registered in ProviderFactory.

## Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Phase 4: Prompt Rendering](./PHASE_4_PROMPT_RENDERING_LAYER.md)
- [Logger Documentation](../logger/README.md)
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
