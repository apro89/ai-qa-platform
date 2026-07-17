# Phase 5: LLM Provider Abstraction Layer — Enterprise Architecture

> **STATUS**: Design Only (Future Phase)  
> **VERSION**: 1.0  
> **DATE**: 2026-07-17

---

## Overview

### Why Phase 5 is Critical

Phase 4 produces **provider-independent `PromptMessages`**.

Phase 5 **adapts these messages** to specific LLM providers.

This separation ensures:

- ✅ No vendor lock-in
- ✅ Configuration-driven provider selection
- ✅ Easy provider switching
- ✅ Testing with mock providers
- ✅ Future provider support without architecture changes

### The Enterprise Pattern

```
┌─────────────────────────────────────────────────┐
│  Domain Logic (Phases 1-4)                      │
│  ↓ (AI-agnostic code)                           │
│  PromptMessages (provider-independent)          │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  Adapter Layer (Phase 5)                        │
│  ├─ OpenAI Adapter                              │
│  ├─ Claude Adapter                              │
│  ├─ Gemini Adapter                              │
│  └─ Mock Adapter (for testing)                  │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│  External Services (Providers)                  │
│  ├─ OpenAI API                                  │
│  ├─ Anthropic (Claude) API                      │
│  ├─ Google (Gemini) API                         │
│  └─ Local Models                                │
└─────────────────────────────────────────────────┘
```

---

## Architecture

### Core Abstractions

#### 1. ILLMProvider Interface

```typescript
interface ILLMProvider {
  // Configuration
  getProviderName(): string;
  getModels(): string[];
  getDefaultModel(): string;

  // Transformation (Phase 4 → Provider Format)
  transformPrompt(messages: PromptMessages): ProviderPromptFormat;

  // LLM Call (Phase 5 only)
  callLLM(
    transformedPrompt: ProviderPromptFormat,
    model?: string,
    options?: CallOptions,
  ): Promise<LLMResponse>;

  // Response Parsing
  parseResponse(response: LLMResponse): {
    code: string;
    message?: string;
    metadata?: Record<string, unknown>;
  };

  // Validation
  validateConfig(config: unknown): boolean;
}
```

#### 2. Provider Configuration Pattern

```typescript
interface ProviderConfig {
  // Provider selection
  provider: 'openai' | 'claude' | 'gemini' | 'local';
  model: string;

  // API credentials (externalized to env vars)
  apiKey?: string; // From process.env
  baseUrl?: string; // Custom endpoint

  // Behavior
  temperature?: number; // 0-1, default 0.2
  maxTokens?: number; // Default 4096
  topP?: number; // 0-1, nucleus sampling
  topK?: number; // Top-k sampling

  // Retry policy
  maxRetries?: number; // Default 3
  retryDelayMs?: number; // Default 1000

  // Timeouts
  requestTimeoutMs?: number; // Default 30000

  // Cost tracking
  trackCosts?: boolean;
  costLimit?: number; // Stop if exceeded
}
```

#### 3. LLMProviderFactory

```typescript
class LLMProviderFactory {
  private static providers: Map<string, ILLMProvider> = new Map();

  static register(name: string, provider: ILLMProvider): void {
    this.providers.set(name, provider);
  }

  static create(config: ProviderConfig): ILLMProvider {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${config.provider}`);
    }

    // Validate config
    if (!provider.validateConfig(config)) {
      throw new Error(`Invalid config for ${config.provider}`);
    }

    return provider;
  }

  static listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
```

---

## Provider Implementations

### Provider 1: OpenAI Adapter

```typescript
class OpenAIAdapter implements ILLMProvider {
  constructor(private config: OpenAIConfig) {}

  getProviderName(): string {
    return 'openai';
  }

  getModels(): string[] {
    return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }

  transformPrompt(messages: PromptMessages): OpenAIMessage[] {
    // Phase 4 → OpenAI Format
    return [
      {
        role: 'system',
        content: messages.systemPrompt,
      },
      {
        role: 'user',
        content: messages.userPrompt,
      },
    ];
  }

  async callLLM(
    messages: OpenAIMessage[],
    model: string = 'gpt-4',
    options?: CallOptions,
  ): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: this.config.temperature ?? 0.2,
        max_tokens: this.config.maxTokens ?? 4096,
        top_p: this.config.topP,
      }),
    });

    return response.json();
  }

  parseResponse(response: OpenAIResponse): {
    code: string;
    message?: string;
    metadata?: Record<string, unknown>;
  } {
    const choice = response.choices[0];
    return {
      code: choice.message.content,
      message: choice.finish_reason,
      metadata: {
        tokens: response.usage,
        model: response.model,
        finishReason: choice.finish_reason,
      },
    };
  }

  validateConfig(config: unknown): boolean {
    const cfg = config as OpenAIConfig;
    return !!cfg.apiKey && !!cfg.model;
  }
}
```

### Provider 2: Claude Adapter

```typescript
class ClaudeAdapter implements ILLMProvider {
  constructor(private config: ClaudeConfig) {}

  getProviderName(): string {
    return 'claude';
  }

  getModels(): string[] {
    return ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
  }

  transformPrompt(messages: PromptMessages): ClaudeFormat {
    // Phase 4 → Claude Format
    // Note: Claude uses different message structure
    return {
      system: messages.systemPrompt,
      messages: [
        {
          role: 'user',
          content: messages.userPrompt,
        },
      ],
    };
  }

  async callLLM(
    prompt: ClaudeFormat,
    model: string = 'claude-3-sonnet',
    options?: CallOptions,
  ): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system: prompt.system,
        messages: prompt.messages,
        max_tokens: this.config.maxTokens ?? 4096,
        temperature: this.config.temperature ?? 0.2,
      }),
    });

    return response.json();
  }

  parseResponse(response: ClaudeResponse): {
    code: string;
    message?: string;
    metadata?: Record<string, unknown>;
  } {
    const content = response.content[0];
    return {
      code: content.text,
      message: response.stop_reason,
      metadata: {
        tokens: response.usage,
        model: response.model,
        stopReason: response.stop_reason,
      },
    };
  }

  validateConfig(config: unknown): boolean {
    const cfg = config as ClaudeConfig;
    return !!cfg.apiKey && !!cfg.model;
  }
}
```

### Provider 3: Gemini Adapter

```typescript
class GeminiAdapter implements ILLMProvider {
  constructor(private config: GeminiConfig) {}

  getProviderName(): string {
    return 'gemini';
  }

  getModels(): string[] {
    return ['gemini-2.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }

  transformPrompt(messages: PromptMessages): GeminiFormat {
    // Phase 4 → Gemini Format
    return {
      contents: [
        {
          role: 'user',
          parts: [{ text: `System: ${messages.systemPrompt}\n\nUser: ${messages.userPrompt}` }],
        },
      ],
      systemInstruction: {
        parts: [{ text: messages.systemPrompt }],
      },
    };
  }

  async callLLM(
    prompt: GeminiFormat,
    model: string = 'gemini-2.0-pro',
    options?: CallOptions,
  ): Promise<LLMResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          ...prompt,
          generationConfig: {
            temperature: this.config.temperature ?? 0.2,
            maxOutputTokens: this.config.maxTokens ?? 4096,
            topP: this.config.topP,
          },
        }),
      },
    );

    return response.json();
  }

  parseResponse(response: GeminiResponse): {
    code: string;
    message?: string;
    metadata?: Record<string, unknown>;
  } {
    const candidate = response.candidates[0];
    return {
      code: candidate.content.parts[0].text,
      message: candidate.finishReason,
      metadata: {
        tokens: response.usageMetadata,
        finishReason: candidate.finishReason,
      },
    };
  }

  validateConfig(config: unknown): boolean {
    const cfg = config as GeminiConfig;
    return !!cfg.apiKey && !!cfg.model;
  }
}
```

### Provider 4: Mock Adapter (Testing)

```typescript
class MockLLMAdapter implements ILLMProvider {
  private responses: Map<string, string> = new Map();

  constructor(private config: MockConfig = {}) {}

  getProviderName(): string {
    return 'mock';
  }

  getModels(): string[] {
    return ['mock-model'];
  }

  transformPrompt(messages: PromptMessages): MockPromptFormat {
    // No transformation for mock
    return {
      system: messages.systemPrompt,
      user: messages.userPrompt,
    };
  }

  async callLLM(
    prompt: MockPromptFormat,
    model: string = 'mock-model',
    options?: CallOptions,
  ): Promise<MockResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return predefined response or default
    const key = `${prompt.system.substring(0, 50)}_${prompt.user.substring(0, 50)}`;
    const response = this.responses.get(key) || this.getDefaultResponse();

    return {
      choices: [{ text: response }],
      usage: { tokens: 100 },
    };
  }

  registerResponse(systemKey: string, userKey: string, response: string): void {
    const key = `${systemKey}_${userKey}`;
    this.responses.set(key, response);
  }

  private getDefaultResponse(): string {
    return `export class GeneratedTest {
  async execute() {
    // Mock generated code
  }
}`;
  }

  parseResponse(response: MockResponse): {
    code: string;
    message?: string;
  } {
    return {
      code: response.choices[0].text,
      message: 'success',
    };
  }

  validateConfig(config: unknown): boolean {
    return true; // Mock always valid
  }
}
```

---

## Integration Pattern

### How Phase 4 and Phase 5 Work Together

```typescript
// Phase 3: AIRequest
const request: AIRequest = {
  templateType: 'GenerateAutomation',
  objective: 'Create login test',
  // ... rest of request
};

// Phase 4: Render to provider-independent messages
const promptMessages: PromptMessages = await promptRenderer.render(request);
// Result:
// {
//   systemPrompt: "You are a Playwright automation expert...",
//   userPrompt: "Create a login test...",
//   metadata: { ... }
// }

// Phase 5: Transform to provider-specific format
const config: ProviderConfig = {
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.2,
  maxTokens: 4096,
};

const adapter = LLMProviderFactory.create(config);
const openaiMessages = adapter.transformPrompt(promptMessages);
// Result: OpenAI message format

// Phase 5: Call LLM
const response = await adapter.callLLM(openaiMessages, 'gpt-4');

// Phase 5: Parse response
const generated = adapter.parseResponse(response);
// Result: { code: "...", metadata: {...} }
```

---

## Configuration Management

### Environment-Based Provider Selection

```bash
# .env.local
AI_PROVIDER=openai
AI_PROVIDER_MODEL=gpt-4
OPENAI_API_KEY=sk-...

# Or
AI_PROVIDER=claude
AI_PROVIDER_MODEL=claude-3-sonnet
ANTHROPIC_API_KEY=sk-ant-...

# Or testing
AI_PROVIDER=mock
```

### Configuration Loader

```typescript
class ProviderConfigLoader {
  static loadFromEnv(): ProviderConfig {
    const provider = process.env.AI_PROVIDER || 'openai';
    const model = process.env.AI_PROVIDER_MODEL || 'gpt-4';

    return {
      provider: provider as any,
      model,
      apiKey: process.env[`${provider.toUpperCase()}_API_KEY`],
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.2'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096'),
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
    };
  }
}

// Usage
const config = ProviderConfigLoader.loadFromEnv();
const adapter = LLMProviderFactory.create(config);
```

---

## Error Handling & Retry Logic

### Standardized Error Handling

```typescript
class LLMError extends Error {
  constructor(
    public code: string,
    public message: string,
    public provider: string,
    public originalError?: Error,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

interface LLMCallOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

async function callLLMWithRetry(
  adapter: ILLMProvider,
  prompt: unknown,
  options: LLMCallOptions = {},
): Promise<LLMResponse> {
  const { maxRetries = 3, retryDelayMs = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await adapter.callLLM(prompt);
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw new LLMError(
          'LLM_CALL_FAILED',
          `Failed after ${attempt + 1} attempts: ${error.message}`,
          adapter.getProviderName(),
          error,
          false,
        );
      }

      const delay = retryDelayMs * Math.pow(2, attempt); // Exponential backoff
      if (options.onRetry) {
        options.onRetry(attempt + 1, error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

---

## Cost Tracking & Monitoring

### Token & Cost Calculation

```typescript
interface TokenCosts {
  [provider: string]: {
    [model: string]: {
      inputTokenCostPer1K: number;
      outputTokenCostPer1K: number;
    };
  };
}

const TOKEN_COSTS: TokenCosts = {
  openai: {
    'gpt-4': {
      inputTokenCostPer1K: 0.03,
      outputTokenCostPer1K: 0.06,
    },
    'gpt-3.5-turbo': {
      inputTokenCostPer1K: 0.0005,
      outputTokenCostPer1K: 0.0015,
    },
  },
  claude: {
    'claude-3-opus': {
      inputTokenCostPer1K: 0.015,
      outputTokenCostPer1K: 0.075,
    },
    'claude-3-sonnet': {
      inputTokenCostPer1K: 0.003,
      outputTokenCostPer1K: 0.015,
    },
  },
  gemini: {
    'gemini-2.0-pro': {
      inputTokenCostPer1K: 0.001,
      outputTokenCostPer1K: 0.002,
    },
  },
};

class CostCalculator {
  static calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const cost = TOKEN_COSTS[provider][model];
    if (!cost) return 0;

    const inputCost = (inputTokens / 1000) * cost.inputTokenCostPer1K;
    const outputCost = (outputTokens / 1000) * cost.outputTokenCostPer1K;

    return inputCost + outputCost;
  }
}
```

---

## Testing Strategy

### MockLLMAdapter Usage in Tests

```typescript
describe('Code Generation Integration', () => {
  let mockAdapter: MockLLMAdapter;

  beforeEach(() => {
    mockAdapter = new MockLLMAdapter();

    // Register test responses
    mockAdapter.registerResponse(
      'system_key',
      'user_key',
      `export class LoginTest {
        async execute() {
          await this.page.fill('[type="email"]', 'user@example.com');
        }
      }`,
    );
  });

  it('should generate code from prompts', async () => {
    const messages: PromptMessages = {
      systemPrompt: 'You are a Playwright expert',
      userPrompt: 'Create a login test',
      metadata: {/* ... */},
    };

    const transformed = mockAdapter.transformPrompt(messages);
    const response = await mockAdapter.callLLM(transformed);
    const generated = mockAdapter.parseResponse(response);

    expect(generated.code).toContain('LoginTest');
  });
});
```

---

## Why This Design is Enterprise-Grade

### 1. **Provider Agnosticism**

- ✅ No vendor lock-in
- ✅ Swappable at configuration time
- ✅ Same code, different providers

### 2. **Extensibility**

- ✅ Easy to add new providers
- ✅ Consistent interface (ILLMProvider)
- ✅ Factory pattern for registration

### 3. **Testability**

- ✅ Mock adapter for unit tests
- ✅ No external API calls needed
- ✅ Deterministic test responses

### 4. **Reliability**

- ✅ Retry logic with exponential backoff
- ✅ Configurable timeout & error handling
- ✅ Comprehensive error information

### 5. **Cost Management**

- ✅ Token tracking per provider/model
- ✅ Cost calculation before/after
- ✅ Optional cost limits (prevent overages)

### 6. **Observability**

- ✅ Centralized logging
- ✅ Metadata for monitoring
- ✅ Performance metrics

---

## Summary

Phase 5 transforms **provider-independent `PromptMessages`** (from Phase 4) into **provider-specific API calls**.

By keeping Phases 1-4 provider-agnostic, the entire domain logic is **independent of any LLM vendor**.

This is what makes the platform **truly enterprise-grade** and **future-proof**.

---

**END OF PHASE 5 PREVIEW**
