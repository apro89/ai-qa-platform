# Project Intelligence Module (Phase 1)

## Purpose

The Project Intelligence module provides foundational project understanding for the AI QA Automation Platform.

This module performs only analysis. It does not generate code, call OpenAI, or create GitHub pull requests.

## Scope

Implemented Phase 1 capabilities:

- Scan a Playwright project recursively through Filesystem MCP abstractions
- Detect core automation layers: pages, components, tasks, questions, interactions, fixtures, tests, utilities, and configurations
- Detect framework metadata: Playwright version, TypeScript version, project structure, and architecture pattern
- Build an in-memory `ProjectStructure` model
- Return structured JSON output

## Clean Architecture Layout

```
logger/
  Logger.ts
  LoggerFactory.ts
  LogLevel.ts
  README.md
  QUICK_REFERENCE.md

analyzers/
  project-analyzer.ts
  project-scanner.ts
  project-parser.ts
  dependency-analyzer.ts
  pattern-detector.ts
  project-structure-builder.ts

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

## Request Flow

1. `ProjectAnalyzer.analyze(projectRootPath)` starts the workflow.
2. `ProjectScanner` uses `FilesystemService` to scan folders/files.
3. `ProjectParser` classifies files into architecture categories.
4. `DependencyAnalyzer` extracts package and framework versions.
5. `PatternDetector` detects `screenplay`, `page-object-model`, or `hybrid`.
6. `ProjectStructureBuilder` builds the final `ProjectStructure` object.
7. `ProjectAnalyzer.analyzeAsJson` serializes to valid JSON.

## Class Responsibilities

- `FilesystemService`: MCP-backed file listing and text reading orchestration
- `ProjectScanner`: recursive project scan
- `ProjectParser`: folder/file classification into domain categories
- `DependencyAnalyzer`: package metadata and dependency extraction
- `PatternDetector`: extensible architecture pattern detection
- `ProjectStructureBuilder`: converts analysis data into `ProjectStructure`
- `ProjectAnalyzer`: use-case orchestrator for full analysis

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

## MCP Integration

All file operations are abstracted behind `IFilesystemMcpClient`.

`FilesystemMcpClient` is an adapter around a generic MCP tool invoker and defaults to:

- `list_dir`
- `read_file`

This keeps filesystem access outside business logic and supports replacement clients for tests.

## Extensibility Points

- Add custom `PatternRule` instances via `PatternDetector.registerRule(...)`
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
