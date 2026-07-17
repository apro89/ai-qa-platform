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
src/
  agents/
  services/
  analyzers/
  models/
  interfaces/
  mcp/
  utils/
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
