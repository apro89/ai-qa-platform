You are a Principal Software Architect and Senior TypeScript Engineer.

Implement Phase 6 of an enterprise AI QA Automation Platform.

IMPORTANT

Implement ONLY Phase 6.

Do NOT generate Playwright tests.

Do NOT write files.

Do NOT integrate GitHub.

Do NOT call any LLM.

The input is already a provider-independent AIResponse.

==================================================
GOAL
==================================================

Build the AI Response Processing Engine.

Its responsibility is to transform a raw AIResponse into
validated domain objects that the rest of the platform can trust.

The engine must work with responses coming from any provider
(OpenAI, Ollama, Claude, Gemini, Azure OpenAI, etc.)

==================================================
CURRENT ARCHITECTURE
==================================================

PromptMessages

↓

LLM Service

↓

AIResponse

↓

AI Response Processing Engine <-- Build this

↓

GenerationResult

==================================================
INPUT
==================================================

Receive

AIResponse

Example

{
provider: "ollama",
model: "llama3.1",
content: "...",
finishReason: "stop"
}

==================================================
OUTPUT
==================================================

Return

GenerationResult

Example

{

success: true,

generatedFiles: [

{

path: "tasks/LoginTask.ts",

content: "...",

type: "task"

}

],

warnings: [],

errors: [],

metadata: {}

}

==================================================
CREATE
==================================================

apps/

    ai-platform/

        src/

            response/

                AIResponseProcessor.ts

                ResponseParser.ts

                JsonExtractor.ts

                JsonRepair.ts

                ResponseValidator.ts

                GenerationResult.ts

                GeneratedFile.ts

                ProcessingReport.ts

==================================================
SERVICES
==================================================

Create

AIResponseProcessor

ResponseParser

JsonExtractor

JsonRepair

ResponseValidator

ProcessingReportBuilder

==================================================
RESPONSIBILITIES
==================================================

AIResponseProcessor

Coordinates the complete processing pipeline.

ResponseParser

Extracts structured content from AIResponse.

JsonExtractor

Extract JSON from

plain text

markdown

```json blocks

mixed responses

JsonRepair

Attempt to repair common JSON mistakes.

Examples

Trailing commas

Missing quotes

Broken arrays

Markdown wrappers

ResponseValidator

Validate

Required fields

File paths

Generated content

Schema compliance

==================================================
EXPECTED JSON FORMAT
==================================================

The parser should expect responses similar to

{

"files":[

{

"path":"tasks/LoginTask.ts",

"type":"task",

"content":"..."

}

]

}

==================================================
VALIDATION
==================================================

Validate

JSON exists

JSON is valid

Required properties exist

Every generated file has

path

type

content

Unknown fields should produce warnings.

==================================================
ERROR HANDLING
==================================================

Create

JsonParseError

JsonValidationError

MissingFieldError

InvalidSchemaError

UnsupportedFormatError

==================================================
LOGGING
==================================================

Use centralized logging.

Log

Processing started

JSON extracted

Repair attempts

Validation result

Warnings

Errors

Execution time

==================================================
TESTS
==================================================

Create unit tests.

Test

Valid JSON

Markdown wrapped JSON

Broken JSON

Missing fields

Invalid schema

Unexpected fields

Empty response

==================================================
README
==================================================

Generate documentation explaining

Architecture

Processing pipeline

Validation flow

JSON repair strategy

Future extension points

==================================================
IMPORTANT
==================================================

Do NOT generate code.

Do NOT modify project files.

Do NOT validate TypeScript syntax.

Do NOT interact with Git.

Return only validated GenerationResult.

The processing engine must be provider-independent.

Design the implementation using

Clean Architecture

SOLID

Dependency Inversion

Resilient parsing.

Assume that LLMs sometimes return malformed responses
and the system should recover whenever possible.
```
