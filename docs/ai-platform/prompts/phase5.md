You are a Principal Software Architect and Senior TypeScript Engineer.

Implement Phase 5 of an enterprise AI QA Automation Platform.

IMPORTANT

Implement ONLY Phase 5.

Do NOT generate Playwright tests.

Do NOT write project files.

Do NOT integrate GitHub.

Do NOT implement response parsing.

Do NOT implement validation.

Only send prompts to an LLM provider and return the raw response.

==================================================
GOAL
==================================================

Build the LLM Provider Layer.

The system already produces PromptMessages.

Your task is to send PromptMessages to an LLM and return
a provider-independent AIResponse.

The architecture must support multiple providers.

Initially implement

- OpenAI Provider

The design must allow future providers

- Claude

- Gemini

- Azure OpenAI

- Ollama

without changing business logic.

==================================================
CURRENT ARCHITECTURE
==================================================

ProjectAnalyzer

↓

ProjectContext

↓

AIRequestBuilder

↓

PromptRenderer

↓

PromptMessages

↓

LLM Provider Layer <-- Build this

↓

Raw AIResponse

==================================================
CREATE
==================================================

apps/

    ai-platform/

        src/

            llm/

                interfaces/

                    ILLMProvider.ts

                models/

                    AIResponse.ts

                    AIUsage.ts

                    AIError.ts

                providers/

                    OpenAIProvider.ts

                services/

                    LLMService.ts

                    ProviderFactory.ts

                    RetryPolicy.ts

                    RateLimiter.ts

                config/

                    LLMConfig.ts

==================================================
INTERFACES
==================================================

Create

interface ILLMProvider

Methods

generate(promptMessages)

healthCheck()

getProviderName()

==================================================
AI RESPONSE
==================================================

Return a provider-independent model.

Example

{

provider: "OpenAI",

model: "gpt-5.5",

content: "...",

usage: {

promptTokens: 500,

completionTokens: 800,

totalTokens: 1300

},

finishReason: "...",

createdAt: ...

}

Never expose provider-specific response objects.

==================================================
OPENAI PROVIDER
==================================================

Implement

OpenAIProvider

Responsibilities

Convert PromptMessages

↓

OpenAI request

Call the API

Receive response

Convert response

↓

AIResponse

==================================================
LLM SERVICE
==================================================

Create

LLMService

Responsibilities

Receive PromptMessages

Select configured provider

Execute request

Return AIResponse

Business logic must never know which provider is used.

==================================================
PROVIDER FACTORY
==================================================

Create

ProviderFactory

Responsible for

Loading configured provider

Returning ILLMProvider implementation

Future providers should require only registration.

==================================================
RETRY POLICY
==================================================

Support retries.

Retry

429

503

Timeout

Configurable retry count.

Exponential backoff.

==================================================
RATE LIMITER
==================================================

Prevent excessive requests.

Track

requests/minute

tokens/minute

==================================================
CONFIGURATION
==================================================

Read configuration from environment.

Examples

OPENAI_API_KEY

LLM_PROVIDER

OPENAI_MODEL

OPENAI_BASE_URL

TEMPERATURE

MAX_TOKENS

==================================================
LOGGING
==================================================

Use centralized logging.

Log

Provider selected

Request started

Request completed

Execution time

Retry attempts

Token usage

Provider errors

==================================================
ERROR HANDLING
==================================================

Create

AIProviderError

AuthenticationError

RateLimitError

TimeoutError

NetworkError

UnsupportedProviderError

==================================================
TESTS
==================================================

Create unit tests.

Mock the OpenAI SDK.

Never call the real API in unit tests.

Test

ProviderFactory

LLMService

RetryPolicy

RateLimiter

OpenAIProvider mapping

==================================================
README
==================================================

Generate documentation explaining

Architecture

Provider abstraction

Adding a new provider

Configuration

Retry mechanism

Error handling

==================================================
IMPORTANT
==================================================

Do NOT parse AI-generated code.

Do NOT validate AI output.

Do NOT create files.

Do NOT modify repositories.

Do NOT implement GitHub integration.

Return only AIResponse.

The implementation must follow

Clean Architecture

SOLID

Dependency Inversion

Provider-independent design.
