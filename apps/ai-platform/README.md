# Project Intelligence & Context Module (Phase 1 & 2)

## Important: Structure Rules

**All developers MUST read [STRUCTURE_RULES.md](./STRUCTURE_RULES.md)**

Key rules:

- ❌ **NO nested `src/` folders** (e.g., no `llm/src/models/`)
- ✅ Direct folder structure only (e.g., `llm/models/`)
- ❌ No new top-level folders without approval
- ✅ Use approved folders listed in STRUCTURE_RULES.md

## Purpose

Foundational project understanding for the AI QA Automation Platform.

- **Phase 1**: Analyze project structure deeply (ProjectStructure)
- **Phase 2**: Transform analysis into AI-agent-ready format (ProjectContext)

This module performs only analysis. It does not generate code, call OpenAI, or create GitHub pull requests.

## Scope

### Phase 1 - Project Intelligence

- Scan a Playwright project recursively through Filesystem MCP abstractions
- Detect core automation layers: pages, components, tasks, questions, interactions, fixtures, tests, utilities, and configurations
- Detect framework metadata: Playwright version, TypeScript version, project structure, and architecture pattern
- Build an in-memory `ProjectStructure` model
- Return structured JSON output
- Centralized logging with debug/trace modes

### Phase 2 - Project Context Builder

- Transform ProjectStructure into compact ProjectContext
- Analyze naming conventions across the project
- Detect coding style patterns (async/await, assertions, locators)
- Map import patterns and dependencies
- Identify reusable components and common patterns
- Validate context consistency
- Serialize to JSON, compact JSON, or Markdown format

## Architecture Flow

```
Phase 1: Detailed Analysis
  ProjectScanner
    ↓ (recursive filesystem scan)
  ProjectParser (artifact classification)
    ↓
  DependencyAnalyzer
    ↓
  PatternDetector
    ↓
  ProjectStructureBuilder
    → ProjectStructure

Phase 2: AI-Ready Context
  ProjectStructure + ScannedProject
    ↓
  NamingConventionService
  CodingStyleAnalyzer
  ImportAnalyzer
  DependencyMapper
  ReusableCodeDetector
    ↓ (ContextBuilder orchestrates)
  ContextValidator
  ContextSerializer
    → ProjectContext (JSON)
```

## Clean Architecture Layout

```
logger/                        Phase 1 & 2: Centralized logging
  Logger.ts
  LoggerFactory.ts
  LogLevel.ts
  README.md
  QUICK_REFERENCE.md

analyzers/                     Phase 1: Project analysis
  project-analyzer.ts
  project-scanner.ts
  project-parser.ts
  dependency-analyzer.ts
  pattern-detector.ts
  project-structure-builder.ts

context/                       Phase 2: Project context builder
  ProjectContext.ts
  ContextBuilder.ts
  ContextValidator.ts
  ContextSerializer.ts
  NamingConventionService.ts
  CodingStyleAnalyzer.ts
  ImportAnalyzer.ts
  DependencyMapper.ts
  ReusableCodeDetector.ts
  README.md
  index.ts

services/
  filesystem-service.ts
  project-analyzer-factory.ts
  project-intelligence-service.ts

models/
  project-structure.ts
  scan-models.ts

interfaces/
  filesystem-mcp-client.ts
  project-analyzer.ts

mcp/
  filesystem-mcp-client.ts

utils/
  path-utils.ts
```

## Phase 1: Project Analysis Request Flow

1. `ProjectAnalyzer.analyze(projectRootPath)` starts the workflow.
2. `ProjectScanner` uses `FilesystemService` to scan folders/files.
3. `ProjectParser` classifies files into architecture categories.
4. `DependencyAnalyzer` extracts package and framework versions.
5. `PatternDetector` detects `screenplay`, `page-object-model`, or `hybrid`.
6. `ProjectStructureBuilder` builds the final `ProjectStructure` object.
7. `ProjectAnalyzer.analyzeAsJson` serializes to valid JSON.

### Phase 1 Class Responsibilities

- `FilesystemService`: MCP-backed file listing and text reading orchestration
- `ProjectScanner`: recursive project scan
- `ProjectParser`: folder/file classification into domain categories
- `DependencyAnalyzer`: package metadata and dependency extraction
- `PatternDetector`: extensible architecture pattern detection
- `ProjectStructureBuilder`: converts analysis data into `ProjectStructure`
- `ProjectAnalyzer`: use-case orchestrator for full analysis

## Phase 2: Project Context Builder Request Flow

1. `ContextBuilder.build(structure, scannedProject)` orchestrates context building
2. `NamingConventionService` analyzes naming patterns for each artifact type
3. `CodingStyleAnalyzer` detects async/await, assertions, locators, imports
4. `ImportAnalyzer` maps internal and external import patterns
5. `DependencyMapper` categorizes and interprets dependencies
6. `ReusableCodeDetector` identifies reusable components and common patterns
7. `ContextValidator` ensures consistency and completeness
8. `ContextSerializer` converts to JSON, compact, or Markdown format

### Phase 2 Class Responsibilities

- `ContextBuilder`: orchestrates all analysis services, validates, serializes
- `NamingConventionService`: detects naming conventions per artifact type
- `CodingStyleAnalyzer`: analyzes code patterns (async, assertions, locators, imports)
- `ImportAnalyzer`: maps import patterns and frequencies
- `DependencyMapper`: categorizes dependencies by purpose
- `ReusableCodeDetector`: identifies reusable objects and common patterns
- `ContextValidator`: validates context completeness and consistency
- `ContextSerializer`: converts ProjectContext to multiple formats

## Observability: Centralized Logging

All services use a centralized logger that provides:

- **No console.log()**: All logging routed through `Logger`
- **Structured output**: Messages include module, timestamp, level, and context
- **Performance tracking**: Built-in timers measure operation duration
- **Debug modes**: `--debug` and `--trace` flags control verbosity
- **Extensible transports**: Console (default), with hooks for File, JSON, OpenTelemetry, Azure Monitor

### Using the Logger

```typescript
import { createLogger } from '@automation/logger/index.js';

const logger = createLogger('MyAnalyzer');

logger.info('Analysis started', { workspace: '/path/to/project' });
logger.startTimer('analysis');
const result = await analyze(project);
logger.endTimer('analysis', { itemsProcessed: 42 });
```

### Running with Debug Output

```bash
pnpm dev --debug    # Enable DEBUG logs
pnpm dev --trace    # Enable TRACE logs (very detailed)
```

See [logger/README.md](./logger/README.md) and [logger/QUICK_REFERENCE.md](./logger/QUICK_REFERENCE.md) for full documentation.

## Phase 2: Project Context Builder

The Context Builder transforms `ProjectStructure` into a compact, AI-agent-friendly `ProjectContext`.

### What It Does

```typescript
const context = await builder.build(projectStructure, scannedProject);
const json = builder.serialize(context, 'json');
```

### Analysis Services

- **NamingConventionService**: Detects naming patterns (PascalCase, camelCase, kebab-case)
- **CodingStyleAnalyzer**: Analyzes async/await, assertions, locators, imports, TypeScript usage
- **ImportAnalyzer**: Maps import patterns and dependency frequencies
- **DependencyMapper**: Categorizes dependencies by purpose and priority
- **ReusableCodeDetector**: Identifies reusable components and common patterns

### Output Format

```json
{
  "framework": "Playwright",
  "architecture": "screenplay",
  "codingStyle": {
    "asyncAwait": true,
    "assertionLibrary": "Playwright Expect",
    "locatorStyle": "getByRole"
  },
  "namingConventions": {
    "pages": { "pattern": "PascalCase", "examples": [...] },
    "tasks": { "pattern": "PascalCase", "examples": [...] }
  },
  "reusableObjects": [...],
  "commonPatterns": ["Screenplay Pattern", "Page Object Model"],
  "importPatterns": [...],
  "topDependencies": [...]
}
```

### Usage

```typescript
import { ContextBuilder } from '@qa/ai-platform/context';

const builder = new ContextBuilder();
const context = await builder.build(structure, scannedProject);

// Serialize to different formats
const fullJson = builder.serialize(context, 'json');
const compact = builder.serialize(context, 'compact');
const markdown = builder.serialize(context, 'markdown');
```

See [context/README.md](./context/README.md) for full documentation.

## MCP Integration

All file operations are abstracted behind `IFilesystemMcpClient`.

`FilesystemMcpClient` is an adapter around a generic MCP tool invoker and defaults to:

- `list_dir`
- `read_file`

This keeps filesystem access outside business logic and supports replacement clients for tests.

## Extensibility Points

Phase 1:

- Add custom `PatternRule` instances via `PatternDetector.registerRule(...)`

Phase 2:

- Add new analysis services (e.g., SecurityPatternDetector, PerformancePatternDetector)
- Implement new serialization formats (YAML, Protobuf, etc.)
- Add caching layer for expensive analyses
- Create context diff and evolution tracking

## Future Phases

- **Phase 3**: AI Test Generation Agent (uses ProjectContext to generate tests)
- **Phase 4**: Code Review Agent (validates generated code)
- **Phase 5**: Execution and Results Analysis
- Extend `ProjectParser` with additional layer patterns
- Add stronger static analysis in `DependencyAnalyzer`
- Add caching and incremental scans in `FilesystemService`

## Phase 5: LLM Provider Layer (✅ Implemented)

The Phase 5 LLM Provider Layer implements a provider-agnostic interface for communicating with Large Language Models.

**Supported Providers:**
- ✅ **OpenAI** - Cloud-based (requires API key)
- ✅ **Ollama** - Local, free, no API key required
- 🔮 Claude, Gemini, Azure OpenAI (future)

**Features:**
- Provider abstraction with pluggable architecture
- Automatic retry with exponential backoff
- Rate limiting (requests & tokens per minute)
- Comprehensive error handling
- Token usage tracking
- Environment-based configuration

**Quick Start:**

See [RUNNING_WITH_LLM_PROVIDERS.md](./RUNNING_WITH_LLM_PROVIDERS.md) for complete setup instructions.

**Using Ollama (Free & Local):**
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Pull a model and run demo
ollama pull mistral
export LLM_PROVIDER=ollama
npm run phase5:demo
```

**Using OpenAI (Requires API Key):**
```bash
export OPENAI_API_KEY=sk-your-key
npm run phase5:demo
```

**Files:**
- `llm/config/LLMConfig.ts` - Configuration management
- `llm/interfaces/ILLMProvider.ts` - Provider interface
- `llm/providers/OpenAIProvider.ts` - OpenAI implementation
- `llm/providers/OllamaProvider.ts` - Ollama implementation (local, free)
- `llm/services/LLMService.ts` - Main orchestration service
- `llm/services/ProviderFactory.ts` - Provider registry
- `llm/services/RetryPolicy.ts` - Retry logic
- `llm/services/RateLimiter.ts` - Rate limiting

**Documentation:**
- [RUNNING_WITH_LLM_PROVIDERS.md](./RUNNING_WITH_LLM_PROVIDERS.md) - How to run with different providers
- [docs/ai-platform/PHASE_5_LLM_PROVIDER_LAYER.md](../../docs/ai-platform/PHASE_5_LLM_PROVIDER_LAYER.md) - Architecture details
- [llm/README.md](./llm/README.md) - API reference

## Future Phases

- **Phase 6**: Test Generation using LLM Provider
- Extend `ProjectParser` with additional layer patterns
- Add stronger static analysis in `DependencyAnalyzer`
- Add caching and incremental scans in `FilesystemService`

## Example Output Shape

```json
{
  "framework": {},
  "folders": {},
  "pages": [],
  "components": [],
  "tasks": [],
  "interactions": [],
  "questions": [],
  "fixtures": [],
  "tests": [],
  "utilities": [],
  "configurations": [],
  "dependencies": [],
  "playwrightConfig": {},
  "packageInfo": {}
}
```
