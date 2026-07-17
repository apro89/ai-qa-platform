# AI Platform - Structure Rules

## Strict Requirements

### 1. No Nested `src` Folders

**FORBIDDEN:**

- ❌ `llm/src/models/`
- ❌ `services/src/`
- ❌ Any nested `src/` folder under ai-platform

**REQUIRED:**

- ✅ Direct placement: `llm/models/`, `llm/index.ts`
- ✅ Top-level organization only

### 2. Allowed Top-Level Folders

Only these folders are permitted in `/apps/ai-platform`:

```
agents/           - Agent wrappers (project-intelligence-agent.ts)
ai/               - Phase 3: AIRequestBuilder and related services
analyzers/        - Project analysis (Phase 1)
api/              - Server exports (server.ts)
context/          - ProjectContext and related analysis
interfaces/       - Type contracts and ports
logger/           - Logging infrastructure
llm/              - LLM provider models (AIUsage, AIResponse, etc.)
mcp/              - MCP client adapters
models/           - Domain models (project-structure.ts)
prompts/          - Phase 4: Prompt rendering layer
services/        - Application services (filesystem, project-analyzer)
utils/            - Utility functions (path-utils.ts)
```

No additional top-level folders may be created.

### 3. File Organization Rules

- **Model files** (`AIUsage.ts`, `AIResponse.ts`, etc.) → `llm/models/`
- **Provider adapters** → `llm/providers/` (for Phase 5)
- **Config files** → `llm/config/` (if needed)
- **Phase files** → `phase3-demo.ts`, `phase4-demo.ts` in root

### 4. Module Resolution

All imports must use:

- Absolute paths with `@automation/` or project name prefixes
- File extensions: `.js` (ESM modules)
- Never relative imports outside immediate folder

**Good:**

```typescript
import { AIUsage } from './llm/models/AIUsage.js';
import { createLogger } from './logger/index.js';
```

**Bad:**

```typescript
import { AIUsage } from './src/llm/models/AIUsage.js';
import { AIUsage } from '../../src/llm/models/AIUsage';
```

### 5. Cleanup Policy

Before each merge:

```bash
# Verify no src folders exist
find apps/ai-platform -name "src" -type d

# Verify no empty directories
find apps/ai-platform -type d -empty
```

Both must return zero results.

### 6. Adding New Features

**When adding files for Phase 5+ (LLM providers):**

1. Determine which top-level folder owns the code
2. Create subdirectories only within approved folders
3. Never create new top-level folders
4. Update this file if new subdirectories are needed

**Example (Phase 5 - OpenAI adapter):**

```
✅ llm/providers/openai-provider.ts
✅ llm/providers/openai-config.ts
❌ llm/src/providers/openai-provider.ts  (FORBIDDEN)
❌ openai-llm/openai-provider.ts         (FORBIDDEN)
```

## Phase Boundaries

- **Phase 1:** `analyzers/` + `services/` + `models/`
- **Phase 2:** `context/` (ProjectContext analysis)
- **Phase 3:** `ai/` (AIRequestBuilder)
- **Phase 4:** `prompts/` (PromptRenderer)
- **Phase 5:** `llm/providers/` (LLM adapters) - NEW

## File Naming

- **Folders:** kebab-case or PascalCase (consistent per folder)
- **Files:** kebab-case (service-name.ts, not ServiceName.ts)
- **Classes:** PascalCase (class ServiceName in service-name.ts)
- **Interfaces:** PascalCase with I prefix or without (IService or Service)

## Enforcing These Rules

Add to CI/CD:

```bash
#!/bin/bash
# Check for forbidden src folders
if find apps/ai-platform -name "src" -type d | grep -q .; then
  echo "ERROR: Nested src/ folders found in ai-platform"
  exit 1
fi

# Check for empty directories
if find apps/ai-platform -type d -empty | grep -q .; then
  echo "ERROR: Empty directories found in ai-platform"
  exit 1
fi

echo "✓ Structure rules passed"
```
