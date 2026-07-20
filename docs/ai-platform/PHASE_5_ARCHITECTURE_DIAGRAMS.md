# Phase 5 Architecture Diagram

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROJECT ANALYSIS (Phase 1)                   │
│                                                                     │
│   ProjectScanner → ProjectParser → ProjectAnalyzer → ProjectContext │
│                                                                     │
│   Output: Project structure, dependencies, patterns                │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CONTEXT PREPARATION (Phase 2)                     │
│                                                                     │
│  ContextBuilder → ContextValidator → ContextSerializer             │
│                                                                     │
│  Output: Enriched ProjectContext with coding style, patterns       │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   REQUEST BUILDING (Phase 3)                        │
│                                                                     │
│   AIRequestBuilder → AIRequest (task, context, params)             │
│                                                                     │
│   Output: Structured request specification                         │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PROMPT RENDERING (Phase 4)                        │
│                                                                     │
│   PromptTemplateService → PromptRenderer → PromptMessages[]        │
│                                                                     │
│   [ { role: 'system', content: '...' }                             │
│     { role: 'user', content: '...' } ]                             │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
╔═════════════════════════════════════════════════════════════════════╗
║                     LLM EXECUTION (Phase 5)                         ║
║                                                                     ║
║  ┌──────────────────────────────────────────────────────────────┐  ║
║  │                    LLMService                               │  ║
║  │                                                              │  ║
║  │  1. Load config via LLMConfig.fromEnv()                    │  ║
║  │  2. Create provider via ProviderFactory                    │  ║
║  │  3. Check rate limits via RateLimiter.checkLimit()         │  ║
║  │  4. Execute with retry via RetryPolicy.execute()          │  ║
║  │  5. Record usage via RateLimiter.recordRequest()          │  ║
║  │                                                              │  ║
║  └────────────┬──────────┬──────────┬──────────┬──────────────┘  ║
║               │          │          │          │                 ║
║               ▼          ▼          ▼          ▼                 ║
║           Config    Provider    RateLimiter RetryPolicy         ║
║               │          │          │          │                 ║
║  ┌────────────┴──────────┴──────────┴──────────┴───────────┐    ║
║  │                                                          │    ║
║  │              ProviderFactory                            │    ║
║  │          (Registry & Discovery)                         │    ║
║  │                                                          │    ║
║  │  OpenAIProvider ← registered                           │    ║
║  │  ClaudeProvider ← will be registered                   │    ║
║  │  GeminiProvider ← will be registered                   │    ║
║  │                                                          │    ║
║  └────────────┬──────────────────────────────────────────┘    ║
║               │                                                 ║
║               ▼                                                 ║
║  ┌────────────────────────────────────────────────────────┐    ║
║  │           ILLMProvider Interface                        │    ║
║  │                                                         │    ║
║  │  generate(messages) → Promise<AIResponse>             │    ║
║  │  healthCheck() → Promise<void>                        │    ║
║  │  getProviderName() → string                           │    ║
║  │  getModel() → string                                  │    ║
║  └────────────┬────────────────────────────────────────┘    ║
║               │                                                 ║
║  ┌────────────┴─────────────────────────────────────────┐     ║
║  │                                                       │     ║
║  ▼                                                       ▼     ║
║  OpenAI API                                    Future Providers ║
║  (calls /chat/completions)                    (Claude, Gemini) ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LLM RESPONSE (Phase 5)                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ AIResponse                                                   │  │
│  │ ├─ content: string                                          │  │
│  │ ├─ usage: { promptTokens, completionTokens, totalTokens }   │  │
│  │ └─ metadata:                                                │  │
│  │    ├─ provider: "openai"                                    │  │
│  │    ├─ model: "gpt-4o"                                       │  │
│  │    ├─ finishReason: "stop" | "length" | "content_filter"    │  │
│  │    └─ createdAt: Date                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Provider Architecture (Extensible Design)

```
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer                                   │
│                                                          │
│  Uses: LLMService (only entry point)                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Service Orchestration Layer                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  LLMService                                      │  │
│  │  - Routing                                       │  │
│  │  - Rate limiting                                │  │
│  │  - Retry coordination                           │  │
│  │  - Error mapping                                │  │
│  └──────────┬───────────────────────────────────────┘  │
│             │                                           │
│  ┌──────────┴──────────────────────────────────────┐  │
│  │  ProviderFactory (Dependency Injection)        │  │
│  │  - Registry pattern                            │  │
│  │  - Runtime registration                        │  │
│  │  - No provider hardcoding                       │  │
│  └──────────┬───────────────────────────────────────┘  │
└─────────────┼───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  Provider Interface                                     │
│                                                          │
│  interface ILLMProvider {                              │
│    generate(messages)                                  │
│    healthCheck()                                       │
│    getProviderName()                                   │
│    getModel()                                          │
│  }                                                      │
└──────────────┬──────────────────────────────────────────┘
               │
     ┌─────────┼─────────┬─────────┐
     │         │         │         │
     ▼         ▼         ▼         ▼
┌─────────┐ ┌───────┐ ┌───────┐ ┌─────────┐
│ OpenAI  │ │Claude │ │Gemini │ │ Azure   │
│Provider │ │Provider│ │Provider│ │OpenAI   │
│         │ │(Future)│ │(Future)│ │(Future) │
│✅ Ready │ │   📋  │ │  📋   │ │  📋    │
└────┬────┘ └───┬───┘ └───┬───┘ └────┬────┘
     │          │         │         │
     └──────────┼─────────┼─────────┘
                │
                ▼
        LLM APIs/Services
```

## Rate Limiting & Retry Flow

```
┌─────────────────────────────────┐
│  Generate Request               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  RateLimiter.checkLimit()       │
│  - Track requests/min           │
│  - Track tokens/min             │
│  - Verify limits OK             │
└────────────┬────────────────────┘
             │
        ✅ OK │ ❌ Limit exceeded
             │   └─→ RateLimitError
             │       (will retry)
             │
             ▼
┌─────────────────────────────────┐
│  RetryPolicy.execute()          │
│                                 │
│  for attempt = 0 to maxRetries  │
│    try {                        │
│      return provider.generate() │
│    } catch (err) {              │
│      if (isRetryable(err)) {   │
│        wait(exponentialBackoff) │
│        retry++                  │
│      } else {                   │
│        throw err                │
│      }                          │
│    }                            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Provider.generate()            │
│  - Convert to API format        │
│  - Call API                     │
│  - Convert response             │
│  - Return AIResponse            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  RateLimiter.recordRequest()    │
│  - Track actual tokens used     │
│  - Update sliding window        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Return AIResponse              │
└─────────────────────────────────┘
```

## Error Handling Decision Tree

```
                    Provider API Error
                            │
                ┌───────────┴──────────┐
                │                      │
               401                    429
          (Auth Failed)        (Rate Limited)
                │                      │
                ▼                      ▼
        AuthenticationError      RateLimitError
                │                      │
         ❌ NOT RETRYABLE      ✅ RETRYABLE
                │                      │
                ▼                      ▼
          Fail immediately   Exponential Backoff
                                       │
                                ┌──────┴──────┐
                                │             │
                           Success        Max Retries
                                │             │
                                ▼             ▼
                           Continue      Throw Error
                                             │
                                             ▼
                                  Caller handles AIError


                       Other Errors
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
       400              Timeout              Network
      (Bad Request)        │                    │
        │                  ▼                    ▼
        ▼            TimeoutError         NetworkError
   InvalidRequest         │                    │
      Error               │                    │
        │          ✅ RETRYABLE       ✅ RETRYABLE
        │                 │                    │
   ❌ NOT              Exponential         Exponential
   RETRYABLE           Backoff             Backoff
        │                 │                    │
        ▼                 ▼                    ▼
    Fail           Retry with            Retry with
  immediately      Backoff               Backoff
```

## Component Dependencies

```
LLMService (orchestrator)
    │
    ├─→ LLMConfig (configuration)
    │
    ├─→ ProviderFactory (provider creation)
    │   └─→ ILLMProvider (interface)
    │       └─→ OpenAIProvider (implementation)
    │
    ├─→ RetryPolicy (retry logic)
    │   └─→ AIError (error types)
    │
    ├─→ RateLimiter (rate limiting)
    │   └─→ RateLimitError (error type)
    │
    └─→ Logger (logging)

AIResponse (output)
    ├─→ AIUsage (token tracking)
    └─→ AIError (error mapping)

LLMConfig (input)
    └─→ Logger (validation logging)
```

## Execution Timeline Example

```
Time  Event                              Duration
──────────────────────────────────────────────────
0ms   Request received
5ms   Config loaded                      +5ms
10ms  Provider instantiated              +5ms
15ms  Rate limits checked                +5ms
20ms  Retry policy initialized           +5ms
25ms  OpenAI API called                  ─────┐
      (waiting for response)                   │ ~1500ms
      ..............................           │
1525ms Response received                 ─────┘
1530ms Tokens extracted & recorded       +5ms
1540ms Error mapping (if needed)         +5ms-20ms
1545ms Response returned to caller       +5ms
```

## Multi-Provider Scenario

```
┌──────────────────────────────────────────┐
│  At Runtime:                             │
│  LLM_PROVIDER=openai                     │
│  OPENAI_API_KEY=sk-...                   │
└──────────┬───────────────────────────────┘
           │
           ▼
        Service created
           │
           ▼
        Uses: OpenAIProvider
           │
           ▼
        Works with OpenAI


To switch to Claude later:
┌──────────────────────────────────────────┐
│  LLM_PROVIDER=claude                     │
│  CLAUDE_API_KEY=sk-ant-...               │
└──────────┬───────────────────────────────┘
           │
           ▼
        Service created
           │
           ▼
        Uses: ClaudeProvider
           │
           ▼
        Works with Claude

NO CODE CHANGES NEEDED! 🎉
```

## Request/Response Example

```
INPUT: PromptMessages
┌────────────────────────────────────┐
│ [                                  │
│   {                                │
│     "role": "system",              │
│     "content": "You are a QA..."   │
│   },                               │
│   {                                │
│     "role": "user",                │
│     "content": "Write a test..."   │
│   }                                │
│ ]                                  │
└────────────────────────────────────┘

OpenAI API Request
┌────────────────────────────────────┐
│ POST /v1/chat/completions          │
│ {                                  │
│   "model": "gpt-4o",               │
│   "messages": [...],               │
│   "temperature": 0.7,              │
│   "max_tokens": 2048               │
│ }                                  │
└────────────────────────────────────┘

OpenAI API Response
┌────────────────────────────────────┐
│ {                                  │
│   "id": "chatcmpl-...",            │
│   "choices": [{                    │
│     "message": {                   │
│       "content": "test('should..." │
│     },                             │
│     "finish_reason": "stop"        │
│   }],                              │
│   "usage": {                       │
│     "prompt_tokens": 500,          │
│     "completion_tokens": 800,      │
│     "total_tokens": 1300           │
│   }                                │
│ }                                  │
└────────────────────────────────────┘

OUTPUT: AIResponse
┌────────────────────────────────────┐
│ {                                  │
│   "content": "test('should...",    │
│   "usage": {                       │
│     "promptTokens": 500,           │
│     "completionTokens": 800,       │
│     "totalTokens": 1300            │
│   },                               │
│   "metadata": {                    │
│     "provider": "openai",          │
│     "model": "gpt-4o",             │
│     "finishReason": "stop",        │
│     "createdAt": "2026-01-15..."   │
│   }                                │
│ }                                  │
└────────────────────────────────────┘
```

## Provider Expansion Path

```
Phase 5 Complete (OpenAI)
        │
        ▼
Phase 5.1 Add Claude
        │
        ├─ Create ClaudeProvider implements ILLMProvider
        ├─ Register in ProviderFactory
        ├─ Add CLAUDE_* environment variables
        ├─ Add tests
        └─ ✅ Done - no other changes needed
        │
        ▼
Phase 5.2 Add Gemini
        │
        ├─ Create GeminiProvider implements ILLMProvider
        ├─ Register in ProviderFactory
        ├─ Add GEMINI_* environment variables
        ├─ Add tests
        └─ ✅ Done - no other changes needed
        │
        ▼
Phase 5.3 Add Azure OpenAI
        │
        ├─ Create AzureOpenAIProvider implements ILLMProvider
        ├─ Register in ProviderFactory
        ├─ Add AZURE_* environment variables
        ├─ Add tests
        └─ ✅ Done - no other changes needed
```
