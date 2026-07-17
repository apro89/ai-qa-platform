# AI Platform Structure Rules

## Purpose

This document defines strict structure and maintenance rules for `apps/ai-platform`.

The goal is to keep Phase 1 focused, avoid placeholder clutter, and enforce Clean Architecture boundaries.

## Current Scope

Only Project Intelligence (Phase 1) is implemented.

Anything outside Phase 1 must not introduce implementation files yet.

## Allowed Top-Level Folders

Top-level folders in `apps/ai-platform` are:

- `agents/`
- `analyzers/`
- `api/`
- `interfaces/`
- `mcp/`
- `models/`
- `services/`
- `utils/`
- `events/` (optional; keep only if non-empty and actively used)
- `llm/`, `prompts/`, `repositories/`, `workflows/` are allowed only when they contain active implementation files

Top-level files are:

- `index.ts`
- `README.md`
- `IMPLEMENTATION_ROADMAP.md`
- `STRUCTURE_RULES.md`
- `package.json`

## Strict Rules

1. No placeholder files:

- Do not use `.gitkeep` files.

2. No empty folders:

- Delete any folder that becomes empty.
- Keep a folder only when at least one active file exists.

3. Clean Architecture boundaries:

- `mcp/`: infrastructure adapters only.
- `services/`: orchestration and application services.
- `analyzers/`: project analysis logic.
- `models/`: pure domain and DTO models.
- `interfaces/`: ports/contracts only.
- `utils/`: stateless helpers only.
- `agents/`: agent-facing wrappers only.

4. Dependency direction:

- `analyzers/` and `services/` can depend on `interfaces/`, `models/`, and `utils/`.
- `models/` must not depend on infrastructure.
- `mcp/` must not depend on `agents/`.

5. Phase 1 guardrail:

- No code generation modules.
- No OpenAI integration in this module flow.
- No GitHub workflow automation code in this module flow.
- No new runtime agent implementations beyond Project Intelligence access.

6. Naming and placement:

- One responsibility per file.
- Keep analyzer classes in `analyzers/`.
- Keep service classes in `services/`.
- Keep shared contracts in `interfaces/`.
- Keep JSON output models in `models/`.

7. Config and docs:

- Update `README.md` when folder responsibilities change.
- Update `STRUCTURE_RULES.md` when governance changes.

## Folder Responsibilities (Phase 1)

- `agents/project-intelligence-agent.ts`: agent wrapper over project intelligence service.
- `analyzers/*`: scanning, parsing, dependency analysis, pattern detection, structure building.
- `services/filesystem-service.ts`: filesystem orchestration through MCP client interface.
- `services/project-analyzer-factory.ts`: composition root for analyzer setup.
- `services/project-intelligence-service.ts`: external application service interface.
- `interfaces/filesystem-mcp-client.ts`: filesystem MCP contract.
- `interfaces/project-analyzer.ts`: project analyzer contract.
- `mcp/filesystem-mcp-client.ts`: MCP adapter implementation.
- `models/project-structure.ts`: output model and JSON serialization.
- `models/scan-models.ts`: scan/parsing intermediate models.
- `utils/path-utils.ts`: path normalization and helper utilities.

## Cleanup Policy

Run these checks before merge:

```bash
find apps/ai-platform -name '.gitkeep' -type f
find apps/ai-platform -type d -empty
```

Both commands must return no results.

## Enforcement Recommendation

Add a CI check that fails when:

- Any `.gitkeep` exists under `apps/ai-platform`
- Any empty directory exists under `apps/ai-platform` (excluding `node_modules`)
