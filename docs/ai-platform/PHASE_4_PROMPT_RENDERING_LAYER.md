# Phase 4: Prompt Rendering Layer — Complete Design Specification

> **STATUS**: Design Only (No Implementation Yet)  
> **VERSION**: 1.0  
> **DATE**: 2026-07-17

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Module Structure](#module-structure)
4. [Core Services](#core-services)
5. [Data Models](#data-models)
6. [Rendering Pipeline](#rendering-pipeline)
7. [Prompt Templates](#prompt-templates)
8. [Validation Strategy](#validation-strategy)
9. [Extensibility](#extensibility)
10. [Phase 5 Integration](#phase-5-integration)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

### Purpose

Transform an `AIRequest` (output from Phase 3: AI Request Builder) into provider-independent `PromptMessages`.

This layer:

- **Prepares** prompts without sending them
- **Formats** text for readability and clarity
- **Optimizes** content to reduce token usage
- **Validates** completeness and quality
- **Remains agnostic** to LLM provider (OpenAI, Claude, Gemini, etc.)

### Key Principle

> **Do NOT embed provider-specific logic here.**
>
> PromptMessages must be reusable by ANY future LLM adapter.
>
> If Phase 4 contains `openai` or `claude` references, the architecture is wrong.

### Input / Output

```
AIRequest (from Phase 3)
    ↓
    [Phase 4: Prompt Rendering Layer]
    ↓
PromptMessages (provider-independent)
    ↓
[Phase 5: LLM Provider Adapters]
```

---

## Architecture

### Conceptual Flow

```
AIRequest
    ↓
PromptRenderer (Orchestrator)
    ├→ PromptTemplateEngine (Select & assemble template)
    ├→ PromptFormatter (Format text)
    ├→ PromptSanitizer (Clean duplicates)
    ├→ PromptOptimizer (Reduce tokens)
    ├→ PromptValidator (Ensure quality)
    └→ PromptMetadataBuilder (Attach metadata)
    ↓
PromptMessages
    ├ systemPrompt: string
    ├ userPrompt: string
    └ metadata: PromptMetadata
```

### Design Principles

1. **Single Responsibility**: Each class handles one aspect of rendering
2. **Chain of Responsibility**: Services work sequentially
3. **Dependency Inversion**: Depend on abstractions, not concrete providers
4. **Composition**: Assemble prompts from reusable sections
5. **Immutability**: Prompts are built, not mutated
6. **Logging**: Every step is observable

---

## Module Structure

### Directory Layout

```
apps/ai-platform/prompts/
├── PromptRenderer.ts              ← Main orchestrator
├── PromptMessages.ts              ← Output data model
├── PromptTemplateEngine.ts        ← Template selection & assembly
├── PromptSection.ts               ← Reusable prompt section
├── PromptFormatter.ts             ← Text formatting
├── PromptValidator.ts             ← Quality validation
├── PromptSanitizer.ts             ← Deduplication & escaping
├── PromptOptimizer.ts             ← Token reduction
├── PromptMetadataBuilder.ts       ← Metadata creation
├── templates/                      ← Template definitions
│   ├── generate-automation.ts
│   ├── generate-task.ts
│   ├── generate-question.ts
│   ├── generate-interaction.ts
│   ├── refactor-automation.ts
│   └── explain-automation.ts
├── README.md
└── index.ts                        ← Public API
```

---

## Core Services

### 1. PromptRenderer

**Responsibility**: Orchestrate the entire rendering pipeline.

**Public Interface**:

```typescript
class PromptRenderer {
  constructor(
    private templateEngine: PromptTemplateEngine,
    private formatter: PromptFormatter,
    private sanitizer: PromptSanitizer,
    private optimizer: PromptOptimizer,
    private validator: PromptValidator,
    private metadataBuilder: PromptMetadataBuilder,
    private logger: Logger,
  ) {}

  async render(request: AIRequest): Promise<PromptMessages> {
    // 1. Validate input
    // 2. Select template
    // 3. Build sections
    // 4. Format text
    // 5. Sanitize content
    // 6. Optimize for tokens
    // 7. Validate output
    // 8. Build metadata
    // 9. Return PromptMessages
  }
}
```

**Responsibilities**:

- Coordinate all services
- Handle errors gracefully
- Log each step
- Time the entire process
- Return complete PromptMessages

**Error Handling**:

```typescript
// Throw RenderingError if:
- AIRequest is invalid
- Template not found
- Validation fails
- Size limits exceeded
```

---

### 2. PromptTemplateEngine

**Responsibility**: Select and assemble prompt sections based on template type.

**Public Interface**:

```typescript
class PromptTemplateEngine {
  registerTemplate(name: string, template: PromptTemplate): void;

  selectTemplate(templateType: string): PromptTemplate;

  assemblePrompt(
    template: PromptTemplate,
    context: PromptContext,
  ): { systemPrompt: string; userPrompt: string };
}
```

**Template Structure**:

```typescript
interface PromptTemplate {
  name: string;
  version: string;
  description: string;

  systemPromptSections: PromptSection[];
  userPromptSections: PromptSection[];

  constraints?: {
    maxTokens?: number;
    minTokens?: number;
    disallowedCharacters?: string[];
  };
}
```

**Supported Templates**:

- `GenerateAutomation`: Full test scenario with tasks & interactions
- `GenerateTask`: Single reusable task
- `GenerateQuestion`: State verification question
- `GenerateInteraction`: Atomic action (click, fill, etc.)
- `RefactorAutomation`: Improve existing test
- `ExplainAutomation`: Explain code structure

**Assembly Logic**:

```
For each section in template:
  1. Resolve variables from AIRequest context
  2. Filter based on relevance
  3. Format section content
  4. Maintain order
  5. Concatenate with separators
```

---

### 3. PromptFormatter

**Responsibility**: Format text for readability, clarity, and consistency.

**Public Interface**:

```typescript
class PromptFormatter {
  format(text: string, options?: FormatOptions): string;

  addHeading(text: string, level: 1 | 2 | 3): string;
  addSection(title: string, content: string): string;
  addList(items: string[], style: 'bullet' | 'number'): string;
  addCodeBlock(code: string, language: string): string;
  normalizeWhitespace(text: string): string;
}
```

**Formatting Rules**:

1. **Headings**: Use markdown `#`, `##`, `###`
2. **Sections**: Title + divider + content
3. **Lists**: Bullet points or numbered
4. **Code**: Triple backticks with language
5. **Spacing**: Single blank line between sections
6. **Line Length**: Max 100 chars where possible
7. **Indentation**: 2 spaces for nested content
8. **Special Chars**: Escaped where necessary

**Example Output**:

````markdown
# System Prompt

## Project Architecture

Screenplay Pattern with Playwright...

## Naming Conventions

- Pages: LoginPage, CartPage
- Tasks: LoginTask, CheckoutTask

### Code Example

```typescript
export class LoginTask {
  ...
}
```
````

## Safety Rules

1. Do not modify application state
2. Always verify assertions

````

---

### 4. PromptSanitizer

**Responsibility**: Remove duplicates, normalize formatting, escape special characters.

**Public Interface**:
```typescript
class PromptSanitizer {
  sanitize(text: string): string

  removeDuplicateLines(text: string): string
  normalizePunctuation(text: string): string
  escapeSpecialCharacters(text: string): string
  removeTrailingWhitespace(text: string): string
  unifyLineEndings(text: string): string
}
````

**Operations**:

1. **Deduplication**: Remove identical lines (preserving order)
2. **Normalization**: Convert to consistent style
   - `"` → `"`
   - `–` → `-`
   - Multiple spaces → single space
3. **Escaping**: Handle characters that need escaping
   - Backticks in code blocks
   - Quotes in strings
   - Special markdown chars
4. **Whitespace**:
   - Trim leading/trailing
   - Normalize empty lines (max 2 consecutive)
5. **Line Endings**: Always `\n` (LF)

---

### 5. PromptOptimizer

**Responsibility**: Reduce unnecessary text while maintaining clarity.

**Public Interface**:

```typescript
class PromptOptimizer {
  optimize(
    systemPrompt: string,
    userPrompt: string,
    targetTokenCount?: number,
  ): { systemPrompt: string; userPrompt: string };

  getOptimizationScore(text: string): OptimizationScore;
}
```

**Optimization Strategies**:

1. **Remove Redundancy**:
   - Eliminate repeated instructions
   - Merge similar rules
   - Remove verbose explanations

2. **Compress Examples**:
   - Keep 1-2 examples instead of 5+
   - Use concise format

3. **Shorten Instructions**:
   - Use bullets instead of paragraphs
   - Remove "please" and filler words
   - Direct, imperative tone

4. **Prioritize Content**:
   - Critical rules stay
   - Optional guidance moves to end
   - Mark importance levels

5. **Token Budget**:
   - If targetTokenCount set, reduce to fit
   - Prioritize user context over system rules
   - Maintain quality (never drop critical sections)

**Optimization Score**:

```typescript
interface OptimizationScore {
  originalTokens: number;
  optimizedTokens: number;
  ratio: number; // 0.8 = 20% reduction
  readabilityScore: number; // 0-100
  completenessScore: number; // 0-100
}
```

---

### 6. PromptValidator

**Responsibility**: Ensure prompt quality and completeness.

**Public Interface**:

```typescript
class PromptValidator {
  validateSystemPrompt(prompt: string): ValidationResult;
  validateUserPrompt(prompt: string): ValidationResult;
  validatePromptMessages(messages: PromptMessages): ValidationResult;
}
```

**Validation Rules**:

| Check                | Rule                         | Error Level |
| -------------------- | ---------------------------- | ----------- |
| System Prompt Exists | `length > 0`                 | ERROR       |
| User Prompt Exists   | `length > 0`                 | ERROR       |
| Min Length           | `systemPrompt.length >= 100` | WARNING     |
| Max Length           | `prompt.length <= 50000`     | ERROR       |
| Structure            | Has headings, sections       | WARNING     |
| Duplicates           | No repeated paragraphs       | WARNING     |
| Encoding             | Valid UTF-8                  | ERROR       |
| Special Chars        | Properly escaped             | WARNING     |
| Examples             | Has code examples            | WARNING     |
| Clarity              | Readability score >= 60      | WARNING     |

**ValidationResult**:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line?: number;
}
```

---

### 7. PromptMetadataBuilder

**Responsibility**: Create metadata about the rendered prompt.

**Public Interface**:

```typescript
class PromptMetadataBuilder {
  buildMetadata(
    request: AIRequest,
    systemPrompt: string,
    userPrompt: string,
    renderingTime: number,
  ): PromptMetadata;
}
```

**Metadata Structure**:

```typescript
interface PromptMetadata {
  // Identification
  version: string;
  templateType: string;
  requestId: string;

  // Sizing
  systemTokens: number;
  userTokens: number;
  totalTokens: number;

  // Quality
  readabilityScore: number;
  completenessScore: number;
  optimizationRatio: number;

  // Timing
  generatedAt: Date;
  renderingDuration: number; // ms

  // Source
  sourceRequest: {
    requestId: string;
    framework: string;
    architecture: string;
  };

  // Optimization
  appliedOptimizations: string[];
  sanitizations: string[];

  // Future provider data (empty until Phase 5)
  providerMetadata?: Record<string, unknown>;
}
```

---

## Data Models

### PromptMessages (Output)

```typescript
interface PromptMessages {
  // Core content
  systemPrompt: string;
  userPrompt: string;

  // Metadata
  metadata: PromptMetadata;

  // Helper methods
  getTotalTokenCount(): number;
  getEstimatedCost(tokenCostPerK: number): number;
  toJSON(): object;
  validate(): ValidationResult;
}
```

### PromptSection (Building Block)

```typescript
interface PromptSection {
  title: string;
  content: string;
  priority: 'critical' | 'high' | 'normal' | 'low';

  // Variable resolution
  variables?: string[];
  resolve(context: Record<string, unknown>): string;

  // Validation
  validate(): boolean;
}
```

### PromptContext (Internal)

```typescript
interface PromptContext {
  aiRequest: AIRequest;
  selectedPages: ArtifactRef[];
  selectedTasks: ArtifactRef[];
  selectedQuestions: ArtifactRef[];
  selectedInteractions: ArtifactRef[];
  projectContext: {
    framework: string;
    architecture: string;
    namingConventions: Record<string, unknown>;
    codingStyle: Record<string, unknown>;
  };
}
```

### RenderingError

```typescript
class RenderingError extends Error {
  constructor(
    public code: string,
    public message: string,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'RenderingError';
  }
}
```

---

## Rendering Pipeline

### Step-by-Step Flow

```
1. INPUT: AIRequest
   ↓
2. PromptRenderer.render(request)
   ├→ Validate AIRequest
   │  └ Throw if invalid
   ↓
3. PromptTemplateEngine.selectTemplate()
   ├→ Lookup template by request.templateType
   │  └ Throw if not found
   ↓
4. Build PromptContext
   ├→ Extract from AIRequest
   ├→ Select relevant artifacts
   │  └ Use ContextSelector logic
   ↓
5. PromptTemplateEngine.assemblePrompt()
   ├→ For each section in template
   │  ├→ Resolve variables
   │  ├→ Filter content
   │  └→ Concatenate
   ↓
6. PromptFormatter.format()
   ├→ Add headings
   ├→ Normalize spacing
   ├→ Format code blocks
   │  └ Result: formatted text
   ↓
7. PromptSanitizer.sanitize()
   ├→ Remove duplicates
   ├→ Escape special chars
   ├→ Normalize punctuation
   │  └ Result: clean text
   ↓
8. PromptOptimizer.optimize()
   ├→ Reduce redundancy
   ├→ Compress examples
   ├→ Fit token budget
   │  └ Result: optimized text
   ↓
9. PromptValidator.validate()
   ├→ Check completeness
   ├→ Verify structure
   ├→ Score quality
   │  └ Throw if critical errors
   ↓
10. PromptMetadataBuilder.buildMetadata()
    ├→ Count tokens
    ├→ Calculate scores
    ├→ Record optimization
    │  └ Result: metadata
    ↓
11. OUTPUT: PromptMessages
    {
      systemPrompt: "...",
      userPrompt: "...",
      metadata: { ... }
    }
```

### Error Handling Strategy

```typescript
// At each stage, catch and log errors:

try {
  // Stage logic
} catch (error) {
  logger.error('Stage failed', { error, context });
  throw new RenderingError('STAGE_NAME_FAILED', `Failed at stage: ${error.message}`, {
    originalError: error,
  });
}

// Renderer catches all RenderingErrors and:
// 1. Logs full details
// 2. Records in metadata.errors
// 3. Throws with useful context
```

---

## Prompt Templates

### Template Definition Pattern

Each template extends `PromptTemplate`:

```typescript
interface PromptTemplate {
  // Identification
  name: string;
  version: string;
  description: string;
  templateType: 'GenerateAutomation' | 'GenerateTask' | ...;

  // Structure
  systemPromptSections: PromptSection[];
  userPromptSections: PromptSection[];

  // Configuration
  constraints?: {
    maxTokens?: number;
    minTokens?: number;
    tone?: 'formal' | 'casual';
    codeStyle?: 'typescript' | 'javascript';
  };

  // Metadata
  version: string;
  createdAt: Date;
  lastModified: Date;
  author: string;
  description: string;
}
```

### Template Examples

#### GenerateAutomation Template

**System Prompt Sections**:

1. `role`: Your role as an AI
2. `architecture`: Screenplay Pattern explanation
3. `naming`: Naming conventions
4. `codingStyle`: Coding standards
5. `safetyRules`: Critical constraints
6. `playwrightBestPractices`: Framework guidance

**User Prompt Sections**:

1. `businessRequirement`: What to test
2. `projectContext`: Framework and structure
3. `reusableComponents`: Existing pages/tasks
4. `expectedOutput`: What code to generate
5. `constraints`: Specific limitations
6. `examples`: Reference implementations

#### GenerateTask Template

**System Prompt Sections**:

1. `role`: Task specialist
2. `taskStructure`: How to write tasks
3. `interactions`: Available actions
4. `guidelines`: Best practices

**User Prompt Sections**:

1. `requirement`: What task to build
2. `existingComponents`: What we can reuse
3. `expectedSignature`: Function signature
4. `examples`: Similar tasks

#### GenerateQuestion Template

**System Prompt Sections**:

1. `role`: State verification specialist
2. `questionStructure`: How to write questions
3. `assertionPatterns`: Assertion examples

**User Prompt Sections**:

1. `requirement`: What to verify
2. `targetElement`: What element to check
3. `expectedStates`: Possible outcomes

#### GenerateInteraction Template

**System Prompt Sections**:

1. `role`: Interaction specialist
2. `interactionStructure`: Atomic pattern
3. `atomicityRules`: Single responsibility

**User Prompt Sections**:

1. `requirement`: What action to perform
2. `targetElement`: What to interact with
3. `inputs`: Any input data needed

---

## Validation Strategy

### Two-Phase Validation

#### Phase 1: Input Validation (PromptRenderer)

```typescript
validateInput(request: AIRequest): void {
  // Check AIRequest completeness
  if (!request.requestId) throw RenderingError(...);
  if (!request.objective) throw RenderingError(...);
  if (!request.systemInstructions?.length) throw RenderingError(...);
  if (!request.expectedOutput) throw RenderingError(...);

  // Check ProjectContext
  if (!request.projectContext?.framework) throw RenderingError(...);
  if (!request.projectContext?.architecture) throw RenderingError(...);
}
```

#### Phase 2: Output Validation (PromptValidator)

```typescript
validateOutput(messages: PromptMessages): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // System Prompt
  if (!messages.systemPrompt?.length) {
    errors.push({ code: 'EMPTY_SYSTEM', severity: 'error' });
  }
  if (messages.systemPrompt.length < 100) {
    warnings.push({ code: 'SHORT_SYSTEM', severity: 'warning' });
  }

  // User Prompt
  if (!messages.userPrompt?.length) {
    errors.push({ code: 'EMPTY_USER', severity: 'error' });
  }

  // No duplicates
  if (hasDuplicateLines(messages.systemPrompt)) {
    warnings.push({ code: 'DUPLICATE_LINES', severity: 'warning' });
  }

  // Metadata
  if (!messages.metadata) {
    errors.push({ code: 'MISSING_METADATA', severity: 'error' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: calculateScore(errors, warnings)
  };
}
```

---

## Extensibility

### Adding New Templates

```typescript
// 1. Create template definition
const myTemplate: PromptTemplate = {
  name: 'MyTemplate',
  templateType: 'GenerateCustom',
  systemPromptSections: [/* ... */],
  userPromptSections: [/* ... */],
};

// 2. Register with engine
templateEngine.registerTemplate('MyTemplate', myTemplate);

// 3. Use in AIRequest
const request: AIRequest = {
  templateType: 'GenerateCustom',
  // ... rest of request
};
```

### Extending Formatting

```typescript
// Create custom formatter
class CustomFormatter extends PromptFormatter {
  formatCustomSection(content: string): string {
    // Custom logic
  }
}

// Inject into renderer
const renderer = new PromptRenderer(
  templateEngine,
  new CustomFormatter(), // <-- custom
  sanitizer,
  optimizer,
  validator,
  metadataBuilder,
  logger,
);
```

### Custom Validation Rules

```typescript
class CustomValidator extends PromptValidator {
  validateMyCustomRule(prompt: string): ValidationError | null {
    if (!prompt.includes('my-required-phrase')) {
      return {
        code: 'MISSING_PHRASE',
        message: 'Prompt must include "my-required-phrase"',
        severity: 'error',
      };
    }
    return null;
  }
}
```

---

## Phase 5 Integration: LLM Provider Abstraction

### Design Pattern: Adapter + Strategy

Phase 4 outputs **provider-independent** `PromptMessages`.

Phase 5 creates **provider adapters** that transform `PromptMessages` into provider-specific formats.

```
PromptMessages
    ├─→ OpenAIAdapter
    │   └─→ {
    │         model: "gpt-4",
    │         messages: [
    │           { role: "system", content: "..." },
    │           { role: "user", content: "..." }
    │         ],
    │         temperature: 0.2,
    │         max_tokens: 4096
    │       }
    │
    ├─→ ClaudeAdapter
    │   └─→ {
    │         model: "claude-3-sonnet",
    │         system: "...",
    │         messages: [
    │           { role: "user", content: "..." }
    │         ],
    │         max_tokens: 4096
    │       }
    │
    └─→ GeminiAdapter
        └─→ {
              model: "gemini-2.0",
              contents: [
                { parts: [{ text: "..." }] }
              ],
              generationConfig: { ... }
            }
```

### Phase 5 Structure (Preview)

```
apps/ai-platform/llm/
├── ILLMProvider.ts          ← Interface
├── LLMProviderFactory.ts    ← Factory
├── openai/
│   ├── OpenAIAdapter.ts
│   ├── OpenAIConfig.ts
│   └── OpenAIResponse.ts
├── claude/
│   ├── ClaudeAdapter.ts
│   ├── ClaudeConfig.ts
│   └── ClaudeResponse.ts
└── gemini/
    ├── GeminiAdapter.ts
    ├── GeminiConfig.ts
    └── GeminiResponse.ts
```

### Phase 5 Interface (Preview)

```typescript
interface ILLMProvider {
  // Transform Phase 4 output to provider format
  transformPrompt(messages: PromptMessages): unknown;

  // Call LLM (Phase 5 only)
  callLLM(prompt: unknown): Promise<LLMResponse>;

  // Process response
  parseResponse(response: unknown): GeneratedCode;
}

class LLMProviderFactory {
  static create(provider: 'openai' | 'claude' | 'gemini', config: ProviderConfig): ILLMProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIAdapter(config);
      case 'claude':
        return new ClaudeAdapter(config);
      case 'gemini':
        return new GeminiAdapter(config);
    }
  }
}

// Usage in Phase 5:
const adapter = LLMProviderFactory.create('openai', config);
const providerFormat = adapter.transformPrompt(promptMessages);
const response = await adapter.callLLM(providerFormat);
const code = adapter.parseResponse(response);
```

### Key Principle for Phase 5

**Phase 4 knows NOTHING about providers.**

**Phase 5 ONLY transforms and calls providers.**

This separation is what makes the platform **enterprise-grade** and **future-proof**.

---

## Implementation Roadmap

### Phase 4a: Core Services (Week 1)

```
[ ] PromptMessages & PromptSection (data models)
[ ] PromptFormatter (text formatting)
[ ] PromptSanitizer (deduplication)
[ ] PromptValidator (quality checks)
[ ] PromptMetadataBuilder (metadata)
```

**Deliverable**: Core classes, 80% test coverage

### Phase 4b: Template Engine (Week 2)

```
[ ] PromptTemplateEngine (template selection)
[ ] GenerateAutomation template
[ ] GenerateTask template
[ ] GenerateQuestion template
[ ] GenerateInteraction template
```

**Deliverable**: Template system, 10+ templates

### Phase 4c: Orchestration (Week 3)

```
[ ] PromptOptimizer (token reduction)
[ ] PromptRenderer (orchestration)
[ ] Error handling & logging
[ ] Demo with all templates
```

**Deliverable**: Full Phase 4, `pnpm phase4:demo`

### Phase 4d: Testing & Documentation (Week 4)

```
[ ] Unit tests (>90% coverage)
[ ] Integration tests
[ ] README & architecture docs
[ ] Performance benchmarks
```

**Deliverable**: Production-ready code, fully tested

### Phase 5: LLM Provider Abstraction (Future)

```
[ ] ILLMProvider interface
[ ] OpenAIAdapter
[ ] ClaudeAdapter
[ ] GeminiAdapter
[ ] Provider factory
[ ] Tests & docs
```

**Result**: Pluggable provider system

---

## Summary: Why This Design is Enterprise-Grade

### 1. Provider Independence

- **No provider-specific code in Phase 4**
- Adapters handle transformation in Phase 5
- Swap providers via configuration

### 2. Separation of Concerns

- Each service has ONE responsibility
- Services are testable in isolation
- Easy to extend or replace

### 3. Quality Assurance

- Two-phase validation (input + output)
- Comprehensive error handling
- Observable logging at each step

### 4. Scalability

- Template system extensible
- Services composable
- Metadata rich for monitoring

### 5. Maintainability

- Clean architecture
- SOLID principles
- Well-documented responsibilities

### 6. Future-Proof

- Adapter pattern for providers
- Factory for configuration
- Metadata for provider-specific data

---

## Next Steps

1. **Review this specification** with the team
2. **Identify any gaps** or questions
3. **Validate assumptions** about template structure
4. **Plan Phase 4 implementation** using this roadmap
5. **Create unit test skeletons** based on classes
6. **Design Phase 5** (LLM Provider Abstraction) in parallel

---

**END OF PHASE 4 SPECIFICATION**
