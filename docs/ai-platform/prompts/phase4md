You are a Principal Software Architect and Senior TypeScript Engineer.

Implement Phase 3 of an enterprise AI QA Automation Platform.

IMPORTANT

Implement ONLY Phase 3.

Do NOT integrate OpenAI yet.

Do NOT generate Playwright tests.

Do NOT write files.

Do NOT call GitHub.

This phase prepares AI requests only.

==================================================
GOAL
==================================================

Build the AI Request Builder module.

Its responsibility is to collect information from different sources
and produce a complete AIRequest object that can later be sent
to any LLM provider.

This layer must contain ZERO provider-specific logic.

It should work with OpenAI today and any future provider
(Claude, Gemini, Azure OpenAI, Local LLMs).

==================================================
INPUT
==================================================

Receive:

ProjectContext

User Request

Example

"Generate Login automation"

==================================================
OUTPUT
==================================================

Return

AIRequest

Example

{
objective: "...",

projectContext: {...},

userRequest: "...",

architecture: {...},

codingStandards: {...},

reusableObjects: {...},

conventions: {...},

instructions: [...],

expectedOutput: {
format: "JSON"
}
}

==================================================
ARCHITECTURE
==================================================

Create

apps/

    ai-platform/

        src/

            ai/

                AIRequest.ts

                AIRequestBuilder.ts

                AIInstructionBuilder.ts

                RequestValidator.ts

                ContextCompressor.ts

                PromptTemplate.ts

==================================================
CREATE SERVICES
==================================================

Create

AIRequestBuilder

InstructionBuilder

PromptTemplateService

ContextCompressor

ContextSelector

RequestValidator

TokenEstimator

==================================================
RESPONSIBILITIES
==================================================

AIRequestBuilder

Responsible for creating a complete AI request.

InstructionBuilder

Build reusable system instructions.

ContextSelector

Select only relevant project information.

Example

If user asks

Generate Login tests

Do not include CheckoutPage.

ContextCompressor

Reduce unnecessary context.

Avoid sending the entire project.

PromptTemplateService

Provide reusable templates.

Examples

Generate Test

Refactor Test

Generate Task

Generate Question

Generate Page

RequestValidator

Ensure request completeness.

TokenEstimator

Estimate prompt size.

Warn if prompt becomes too large.

==================================================
PROMPT TEMPLATES
==================================================

Support multiple templates.

Examples

GenerateAutomation

GenerateTask

GenerateQuestion

GenerateInteraction

RefactorAutomation

ExplainCode

Future templates should be easy to add.

==================================================
VALIDATION
==================================================

Validate

Required context exists

User request exists

Architecture detected

Framework detected

No duplicated context

==================================================
LOGGING
==================================================

Use the centralized logger.

Log

Request creation started

Selected context

Context size

Estimated token count

Validation result

Execution time

==================================================
README
==================================================

Generate documentation explaining

Purpose

Architecture

Responsibilities

Data flow

Future extension points

==================================================
TESTS
==================================================

Create unit tests for

AIRequestBuilder

ContextSelector

ContextCompressor

RequestValidator

==================================================
IMPORTANT
==================================================

Do NOT call OpenAI.

Do NOT create prompts as strings.

Do NOT generate code.

Do NOT modify files.

Do NOT integrate GitHub.

Only prepare structured AIRequest objects.

Everything should be provider-independent.

Follow Clean Architecture and SOLID.

Design this module so that replacing OpenAI with Claude,
Gemini or another LLM requires changing only the provider layer.
