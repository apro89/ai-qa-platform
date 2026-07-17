# Playwright Automation Framework

This project uses:

- Playwright
- TypeScript
- Screenplay Pattern

These rules are mandatory.

---

# Folder Structure

Only these top-level folders are allowed.

```
automation/
├── actors/
├── abilities/
├── tasks/
├── interactions/
├── questions/
├── pages/
├── tests/
├── config/
├── models/
└── utils/
```

Do not create additional top-level folders.

Every new file must belong to one of these layers.

Never introduce alternative architecture such as:

- helpers/
- common/
- shared/
- services/
- components/
- features/
- lib/
- core/

unless explicitly requested.

---

# Test Organization

Tests are organized by **business domain**, not by execution type.

Correct

```
tests/
├── authentication/
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   └── forgot-password.spec.ts
│
├── users/
│   ├── create-user.spec.ts
│   ├── edit-user.spec.ts
│   └── delete-user.spec.ts
│
├── orders/
│   ├── create-order.spec.ts
│   ├── cancel-order.spec.ts
│   └── refund-order.spec.ts
│
└── checkout/
    ├── payment.spec.ts
    └── guest-checkout.spec.ts
```

Never organize tests like

```
tests/
├── smoke/
├── regression/
├── api/
├── ui/
├── examples/
├── temp/
```

Execution type is determined by **tags**, never by folders.

---

# Test Tags

Every test must include at least one execution tag.

Required tags

- @smoke
- @regression

Optional tags

- @critical
- @api
- @ui
- @mobile
- @visual
- @accessibility
- @slow

Examples

```ts
test('@smoke @ui User can log in', async ({ actor }) => {
    ...
});
```

```ts
test('@regression User cannot log in with invalid credentials', async ({ actor }) => {
    ...
});
```

Tests are executed using tags.

Examples

```
playwright test --grep @smoke
playwright test --grep @regression
```

---

# Test Responsibilities

Tests describe business behaviour only.

Tests must not contain

- page.locator()
- page.click()
- page.fill()
- CSS selectors
- XPath
- business logic

Tests should read like business specifications.

Business behaviour belongs inside Screenplay components.

---

# Pages

Pages contain selectors only.

Pages must not contain

- Playwright actions
- waits
- assertions
- business logic

---

# Tasks

Tasks represent complete business actions.

Tasks

- orchestrate business workflows
- use Interactions
- use Questions
- use Pages

Tasks must never call

- page.locator()
- page.click()
- page.fill()

directly.

---

# Interactions

Interactions represent reusable atomic actions.

Each Interaction has one responsibility.

Examples

- Click
- FillField
- SelectOption
- UploadFile

Interactions contain Playwright implementation details.

---

# Questions

Questions retrieve application state.

Questions

- return data
- perform assertions indirectly
- never modify application state

---

# Utils

Utils contain generic reusable code only.

Do not place browser automation or business logic inside utils.

---

# Architecture

Follow

- Screenplay Pattern
- SOLID
- DRY
- KISS

Prefer composition over inheritance.

Reuse existing Tasks, Questions and Interactions before creating new ones.

Avoid

- duplicated selectors
- duplicated business logic
- duplicated tests
- God classes
- utility classes containing browser logic

---

# Import Conventions

Use the `@automation/*` alias for every internal import.

Always import using

```
@automation/<layer>/<module>.js
```

Always use the `.js` extension because this project uses NodeNext module resolution.

Prefer aliases over relative imports.

Good

```ts
import { LoginTask } from '@automation/tasks/login/LoginTask.js';
```

Bad

```ts
import { LoginTask } from '../../tasks/login/LoginTask';
```

---

# Before Generating Code

Before creating new code always determine

1. Does an equivalent Task already exist?
2. Does an equivalent Interaction already exist?
3. Does an equivalent Question already exist?
4. Does an equivalent Page already exist?
5. Does an equivalent test already exist?
6. Which business domain owns this test?
7. Which execution tags should be applied?

Always extend existing components before creating new ones.

Never duplicate existing behaviour.

---

# Naming

Use descriptive names.

Good

```
LoginTask
CreateOrderTask
UserDashboardPage
CancelOrderQuestion
login.spec.ts
create-order.spec.ts
```

Bad

```
Helper
CommonUtils
Test1
ExampleTask
PageHelper
utils.ts
misc.ts
```

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
