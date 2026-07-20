# Phase 6: AI Response Processing Engine

## Overview

The **AI Response Processing Engine** is responsible for transforming raw, provider-independent `AIResponse` objects into validated `GenerationResult` objects that the rest of the platform can trust.

The engine implements a resilient, multi-stage processing pipeline that extracts JSON from various LLM response formats, repairs malformed content when possible, validates against expected schemas, and provides detailed processing reports for debugging and monitoring.

## Architecture

### Pipeline Stages

```
AIResponse (from LLM)
    ↓
[Stage 1: Extraction]
    ├─ Detect format (plain JSON, markdown, code blocks, etc.)
    └─ Extract JSON content
    ↓
[Stage 2: Repair]
    ├─ Attempt to fix common JSON issues
    ├─ Trailing commas, unquoted keys, etc.
    └─ Validate repaired JSON
    ↓
[Stage 3: Validation]
    ├─ Check schema compliance
    ├─ Validate required fields
    ├─ Validate file paths and types
    └─ Collect warnings for non-critical issues
    ↓
[Stage 4: Result]
    └─ Build GenerationResult with files, warnings, errors, metadata
    ↓
GenerationResult (output)
```

## Core Services

### AIResponseProcessor

**Main orchestrator** for the entire processing pipeline.

```typescript
const processor = new AIResponseProcessor(logger);
const result = await processor.process(aiResponse);
```

**Responsibilities:**

- Receives provider-independent `AIResponse`
- Coordinates all processing stages
- Handles errors gracefully
- Returns validated `GenerationResult`
- Checks for truncated/filtered responses
- Generates processing metadata

### ResponseParser

**Orchestrates extraction, repair, and validation** stages.

```typescript
const parser = new ResponseParser(logger);
const result = parser.parse(content, processingId);
```

**Responsibilities:**

- Extract JSON from various content formats
- Coordinate repair attempts
- Validate against schema
- Generate processing report

### JsonExtractor

**Extracts JSON** from various response formats.

Handles:

- Plain JSON objects and arrays
- Markdown-wrapped JSON (``````json ... ```````)
- Code blocks with language specifiers
- JSON embedded in mixed text content

### JsonRepair

**Attempts to repair common JSON issues** using multiple strategies.

**Repair Strategies:**

1. Trailing commas - Removes commas before `}` or `]`
2. Unescaped newlines - Escapes literal newlines in strings
3. Single quotes - Converts `'key': 'value'` to `"key": "value"`
4. Unquoted keys - Converts `{key: value}` to `{"key": value}`
5. Missing brackets - Completes unmatched `{` or `[`

### ResponseValidator

**Validates parsed JSON** against expected schema and business rules.

**Validation Checks:**

- JSON is an object with `files` array
- Each file has required fields: `path`, `type`, `content`
- File paths are valid format
- File types are recognized
- Content is not empty
- Unknown fields generate warnings (non-failing)

## Models

### GeneratedFile

```typescript
interface GeneratedFile {
  path: string; // e.g., 'tasks/LoginTask.ts'
  type: string; // e.g., 'task', 'page', 'interaction'
  content: string; // File content
  description?: string; // Optional description
  metadata?: Record<string, unknown>; // Custom metadata
}
```

### GenerationResult

**Output of the processing engine.** Contains all processed files and metadata.

```typescript
interface GenerationResult {
  success: boolean;
  generatedFiles: GeneratedFile[];
  warnings: string[];
  errors: string[];
  metadata: {
    processingTimeMs: number;
    totalLines: number;
    repairAttempts: number;
    provider?: string;
    model?: string;
    failureReason?: string;
    [key: string]: unknown;
  };
}
```

### ProcessingReport

**Detailed audit trail** of the entire processing operation. Used for debugging and monitoring.

## Error Handling

### Error Classes

- `ResponseProcessingError` - Base error
- `JsonParseError` - JSON extraction failed
- `JsonValidationError` - JSON doesn't match schema
- `MissingFieldError` - Required field missing
- `InvalidSchemaError` - Schema validation failed
- `UnsupportedFormatError` - Format not recognized

## Expected JSON Format

LLM responses should follow this structure:

```json
{
  "files": [
    {
      "path": "tasks/LoginTask.ts",
      "type": "task",
      "content": "export class LoginTask { ... }",
      "description": "Optional description",
      "metadata": {
        "optional": "custom fields"
      }
    }
  ]
}
```

**Valid file types:**

- `task` - Task class
- `page` - Page class
- `question` - Question class
- `interaction` - Interaction class
- `test` - Test file
- `utility` - Utility/helper
- `model` - Model/interface
- `service` - Service class
- `interface` - TypeScript interface
- `config` - Configuration file

## Usage Example

```typescript
import { AIResponseProcessor, type GenerationResult } from '@qa/ai-platform/response/index.js';
import { LoggerFactory } from '@qa/ai-platform/logger/index.js';

// Set up logger and processor
const loggerFactory = new LoggerFactory();
const logger = loggerFactory.create('ResponseProcessing');
const processor = new AIResponseProcessor(logger);

// Process the response
const result = await processor.process(aiResponse);

// Check result
if (result.success) {
  console.log(`Generated ${result.generatedFiles.length} files`);
  result.generatedFiles.forEach((file) => {
    console.log(`  - ${file.path} (${file.type})`);
  });
} else {
  console.error('Processing failed:', result.errors);
}
```

## Testing

Run tests with:

```bash
pnpm test response
```

**Test Coverage:**

- ✅ JSON extraction (plain, markdown, embedded)
- ✅ JSON repair (trailing commas, quotes, keys, brackets)
- ✅ Schema validation (required fields, types, paths)
- ✅ Error handling (parsing, validation, repair failures)
- ✅ Model factories (file creation, result building)
- ✅ Processing report (tracking, statistics)

## Provider Independence

The engine is **completely provider-agnostic**. It works with responses from:

- OpenAI (GPT-3.5, GPT-4, etc.)
- Ollama (Llama, Mistral, etc.)
- Claude (Anthropic)
- Gemini (Google)
- Azure OpenAI
- Any LLM producing AIResponse format

## Design Principles

- **Clean Architecture** - Clear layer separation, dependency inversion
- **SOLID Principles** - Single responsibility, open/closed, interface segregation
- **Resilience** - Multiple extraction strategies, repair attempts before failure
- **Observability** - Comprehensive logging, processing reports, audit trails

## File Structure

```
response/
├── models/
│   ├── GeneratedFile.ts
│   ├── GenerationResult.ts
│   ├── ProcessingReport.ts
│   └── index.ts
├── services/
│   ├── JsonExtractor.ts
│   ├── JsonRepair.ts
│   ├── ResponseValidator.ts
│   ├── ResponseParser.ts
│   ├── AIResponseProcessor.ts
│   └── index.ts
├── errors/
│   ├── ResponseProcessingError.ts
│   └── index.ts
├── __tests__/
│   ├── JsonExtractor.test.ts
│   ├── JsonRepair.test.ts
│   ├── ResponseValidator.test.ts
│   ├── models.test.ts
│   └── AIResponseProcessor.test.ts
├── index.ts
└── README.md
```

## Dependencies

- `@qa/ai-platform/llm` - AIResponse model
- `@qa/ai-platform/logger` - Logging infrastructure

No external dependencies required.

---

**Phase 6 Implementation Status:** ✅ Complete

Ready for integration with Phase 7 (code generation and file writing).
