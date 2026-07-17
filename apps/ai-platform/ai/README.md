# Phase 3: AI Request Builder Module

## Overview

Phase 3 builds the **AI Request Builder** module that prepares provider-independent requests for any LLM provider (OpenAI, Claude, Gemini, Azure OpenAI, Local LLMs).

**Key principle:** This layer contains **ZERO provider-specific logic**. It assembles complete, validated AI requests that are ready to be sent to any LLM provider.

## What Phase 3 Does

```typescript
const request = await aiRequestBuilder.build({
  projectContext,        // From Phase 1: ProjectIntelligenceService
  userRequest: "Generate Login automation"
});

// Returns: Complete AIRequest object
// Ready for: Any LLM provider in Phase 4
```

## Architecture

### Components

```
AIRequestBuilder (Orchestrator)
├── InstructionBuilder       → System instructions from project conventions
├── ContextSelector          → Intelligent context filtering
├── ContextCompressor        → Deduplication and size reduction
├── PromptTemplateService    → Reusable templates
├── RequestValidator         → Validation of completeness
└── TokenEstimator           → Token counting and warnings
```

### Data Flow

```
ProjectContext + UserRequest
         ↓
   AIRequestBuilder
         ↓
    AIRequest (provider-agnostic)
         ↓
   (Phase 4: Provider adapters)
```

## Services

### AIRequestBuilder
**Responsibility:** Main orchestrator

- Assembles all components
- Validates input and output
- Builds complete AIRequest
- Logs execution metrics

### InstructionBuilder
**Responsibility:** System instructions from project conventions

- Architecture rules (Screenplay Pattern, layers, responsibilities)
- Naming conventions (Pages, Tasks, Questions, Interactions, Tests)
- Coding style (async/await, TypeScript, imports, assertions)
- Safety constraints (never do X, always do Y)
- Template-specific instructions (for GenerateAutomation, GenerateTask, etc.)

### ContextSelector
**Responsibility:** Intelligent filtering of project information

- Extracts keywords from user request
- Selects matching Pages, Tasks, Questions, Interactions
- Includes essential base components
- Avoids unnecessary context

Example: If user says "Generate checkout test", only includes:
- CheckoutPage, HeaderPage (not AdminPage)
- CheckoutTask (not LoginTask)
- Related Questions and Interactions

### ContextCompressor
**Responsibility:** Reduce context size

- Removes null/undefined values
- Deduplicates similar items
- Summarizes long descriptions
- Ensures context stays within size limits

Result: ~20-30% smaller context while keeping essential information

### PromptTemplateService
**Responsibility:** Reusable prompt templates

Supported templates:
- `GenerateAutomation` - Complete test with Task, Interaction, Question
- `GenerateTask` - Single orchestration Task
- `GenerateQuestion` - State verification Question
- `GenerateInteraction` - Atomic action (Click, Fill, Select, etc.)
- `RefactorAutomation` - Improve existing code
- `ExplainCode` - Document code structure

Extensible: Easy to add new templates

### RequestValidator
**Responsibility:** Ensure completeness

Validates:
- Input: ProjectContext, userRequest, templateType
- Output: All required AIRequest fields present
- Produces meaningful error messages
- Warns about suspicious patterns

### TokenEstimator
**Responsibility:** Monitor prompt size

- Estimates token count using word-based heuristics
- Breaks down tokens by component (instructions, context, userRequest)
- Warns when approaching limits
- Provides safe margin (80% of token limit)

## Data Models

### AIRequest

```typescript
{
  requestId: string;
  templateType: string;
  objective: string;
  userRequest: string;
  
  projectContext: {
    framework: "Playwright";
    architecture: "Screenplay Pattern";
    namingConventions: {...};
    codingStyle: {...};
    folderStructure: {...};
  };
  
  systemInstructions: SystemInstruction[];
  
  reusablePatterns: {
    pages: [{name, path, summary}];
    tasks: [{name, path, summary}];
    questions: [{name, path, summary}];
    interactions: [{name, path, summary}];
  };
  
  expectedOutput: {
    format: "JSON" | "TypeScript" | "Markdown" | "PlainText";
    schema?: {...};
    examples?: string[];
    constraints?: string[];
  };
  
  metadata: {
    contextMetadata: {
      selectedPages: number;
      selectedTasks: number;
      selectedQuestions: number;
      selectedInteractions: number;
      estimatedTokenCount: number;
      compressionRatio: number;
      timestamp: string;
    };
    createdAt: string;
    createdBy: "AIRequestBuilder";
    version: "1.0.0";
  };
}
```

## Usage

### Basic Usage

```typescript
import { AIModuleFactory } from './src/ai/ai-module-factory.js';
import { LogLevel } from './src/logger/LogLevel.js';

// Create builder
const builder = AIModuleFactory.createRequestBuilder(LogLevel.INFO);

// Build request
const aiRequest = await builder.build({
  projectContext: projectContext,  // From Phase 1
  userRequest: 'Generate Login automation',
  templateType: 'GenerateAutomation',  // Optional: defaults to GenerateAutomation
});

// Now ready to send to any LLM provider
// This object contains everything the LLM needs to generate code
```

### Add Custom Constraints

```typescript
const aiRequest = await builder.build({
  projectContext,
  userRequest: 'Generate checkout test',
  templateType: 'GenerateAutomation',
  constraints: {
    skipPages: ['AdminPage'],
    onlyFocusOn: ['payment', 'verification'],
  },
});
```

### Register Custom Template

```typescript
const { templateService } = builder;

templateService.registerTemplate('GenerateMobileTest', {
  name: 'GenerateMobileTest',
  description: 'Generate mobile-specific test automation',
  expectedOutput: {
    format: 'TypeScript',
    constraints: ['Use mobile viewports', 'Handle touch events'],
  },
  context: {
    maxTokens: 4096,
    focusAreas: ['mobile', 'responsive'],
  },
});

const request = await builder.build({
  projectContext,
  userRequest: 'Generate mobile checkout test',
  templateType: 'GenerateMobileTest',
});
```

## Running the Demo

```bash
# Install dependencies
pnpm install

# Run Phase 3 demonstration
pnpm phase3:demo

# Output shows:
# - Building requests with different templates
# - Context selection results
# - Token estimation
# - Complete AIRequest structure
# - System instructions generated
# - Reusable patterns available
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- ai-request-builder
```

Test coverage includes:
- Request building with valid input
- Input validation and error handling
- Context selection accuracy
- Compression effectiveness
- Token estimation accuracy
- Template management
- Instruction generation

## Design Principles

### Clean Architecture
- Domain-centric
- Framework-independent
- Testable without external dependencies

### SOLID Principles
- **S**ingle Responsibility: Each service has one clear job
- **O**pen/Closed: Easy to extend (new templates, compression strategies)
- **L**iskov Substitution: Services implement consistent interfaces
- **I**nterface Segregation: Each service exposes minimal interface
- **D**ependency Inversion: Depend on abstractions via factory

### Provider Independence
- Zero OpenAI-specific logic
- Zero Claude-specific logic
- Zero provider-specific imports
- Works with any LLM: OpenAI, Claude, Gemini, Azure, Local LLMs

### Logging & Observability
- Centralized logger throughout
- Execution time tracking
- Token estimation warnings
- Validation result logging

## Future Extensions

### Semantic Context Selection
Replace keyword-based selection with embedding-based search:
```typescript
class SmartContextSelector extends ContextSelector {
  selectRelevantContext(context, userRequest) {
    // Use embeddings to find semantically similar artifacts
  }
}
```

### Dynamic Compression
Adaptive compression based on token budget:
```typescript
contextCompressor.compressTo(maxTokens: 4096);
```

### Provider Adapters (Phase 4)
Convert AIRequest to provider-specific formats:
```typescript
class OpenAIRequestAdapter {
  adapt(aiRequest: AIRequest): OpenAI.ChatCompletionCreateParams { ... }
}

class ClaudeRequestAdapter {
  adapt(aiRequest: AIRequest): Anthropic.MessageParam[] { ... }
}
```

### Caching
Cache frequently generated requests:
```typescript
const cached = await requestCache.get(userRequest);
if (cached) return cached;
```

### Cost Estimation
Predict API costs before sending:
```typescript
const cost = costEstimator.estimate(aiRequest);
```

### Monitoring
Track request patterns and LLM performance:
```typescript
await monitor.trackRequest(aiRequest, response);
```

## Key Features

✅ **Provider-agnostic** - Works with any LLM  
✅ **Type-safe** - Full TypeScript support  
✅ **Validated** - Comprehensive input/output validation  
✅ **Observable** - Detailed logging and metrics  
✅ **Extensible** - Easy to add templates and strategies  
✅ **Efficient** - Context compression and token optimization  
✅ **Tested** - Comprehensive test coverage  
✅ **Clean** - SOLID and Clean Architecture principles  

## Structure

```
apps/ai-platform/src/ai/
├── AIRequest.ts              # Core data models
├── AIRequestBuilder.ts       # Main orchestrator
├── InstructionBuilder.ts     # System instructions
├── ContextSelector.ts        # Context filtering
├── ContextCompressor.ts      # Compression logic
├── PromptTemplateService.ts  # Template management
├── RequestValidator.ts       # Validation
├── TokenEstimator.ts         # Token counting
├── ai-module-factory.ts      # Factory pattern
├── index.ts                  # Public API
└── README.md                 # This file
```

## What's NOT in Phase 3

❌ OpenAI-specific code  
❌ Claude-specific code  
❌ Gemini-specific code  
❌ Any provider-specific logic  
❌ Actual LLM API calls  
❌ Code generation  
❌ Playwright test generation  

All of this belongs in Phase 4+ when provider adapters are implemented.

## Next Phase (Phase 4)

Phase 4 will:
1. Create provider adapters (OpenAI, Claude, etc.)
2. Convert AIRequest to provider-specific format
3. Call LLM APIs
4. Handle and validate responses
5. **No changes needed to Phase 3**

The clean separation means swapping providers requires changing only Phase 4, not the entire pipeline.

---

**Phase 3 is complete when:**
- AIRequestBuilder builds valid AIRequest objects ✓
- All components are properly tested ✓
- Logging and metrics work correctly ✓
- Zero provider-specific logic exists ✓
- Documentation is clear ✓
- Demo runs without errors ✓
