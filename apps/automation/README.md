# UI Automation Framework

An enterprise-oriented Playwright + TypeScript framework using Screenplay rather than Page Objects. It is intentionally structured so a test author—or a future AI agent—can assemble clear business flows from stable, small building blocks.

## Run

From the repository root:

```bash
cp .env.example .env
pnpm install
pnpm --filter @qa/automation exec playwright install
pnpm test:smoke
```

Use `pnpm --filter @qa/automation test:headed` for a visible Chromium run. All smoke test titles include `@smoke`; use `pnpm --filter @qa/automation exec playwright test --grep @smoke --project=firefox` to target a browser.

## Environment

Copy `.env.example` to `.env`. The UI test values you may set are:

| Variable                           | Purpose                           | Default                     |
| ---------------------------------- | --------------------------------- | --------------------------- |
| `PLAYWRIGHT_BASE_URL`              | Application under test            | `https://www.saucedemo.com` |
| `PLAYWRIGHT_WORKERS`               | Parallel workers                  | `4`                         |
| `PLAYWRIGHT_RETRIES`               | Retry count                       | local `0`, CI `2`           |
| `PLAYWRIGHT_TIMEOUT_MS`            | Per-test timeout                  | `30000`                     |
| `PLAYWRIGHT_EXPECT_TIMEOUT_MS`     | Assertion timeout                 | `5000`                      |
| `PLAYWRIGHT_HEADLESS`              | Set `false` for headed local runs | `true`                      |
| `TEST_STANDARD_USERNAME`           | Valid user                        | `standard_user`             |
| `TEST_LOCKED_USERNAME`             | Locked user                       | `locked_out_user`           |
| `TEST_PERFORMANCE_GLITCH_USERNAME` | Delayed-login user                | `performance_glitch_user`   |
| `TEST_PASSWORD`                    | Password for SauceDemo accounts   | `secret_sauce`              |

Do not commit `.env`. GitHub Actions accepts the same values as repository variables, with `TEST_PASSWORD` preferably stored as a repository secret.

## Structure

```text
apps/automation/
├── actors/          # Screenplay actors and the core perform/ask contracts
├── abilities/       # Capabilities such as BrowseTheWeb injected into actors
├── components/      # Reusable UI shell actions composed from tasks/interactions
├── tasks/           # Business actions composed from smaller interactions
├── interactions/    # Atomic UI actions such as click, enter, select, navigate
├── questions/       # Read-only checks that return information about the UI
├── pages/           # Selector-only page objects and reusable target definitions
├── fixtures/        # Playwright fixtures that create actors with the right abilities
├── flows/           # Cross-feature business journeys built from tasks
├── data/            # Typed test-data builders and fixture values
├── models/          # Domain data contracts such as User, Product, CheckoutData
├── config/          # Typed environment configuration
├── tests/           # Smoke, regression, e2e, and generated test suites
└── utils/           # Generic helpers and reusable support utilities
```

Only these layers are part of the intended automation architecture. Keep the package free of extra top-level folders and place responsibilities in the matching layer:

- `pages/` contains only selectors and locator definitions.
- `tasks/` represent business actions and never call `page.locator()` directly.
- `interactions/` are reusable atomic actions with one responsibility each.
- `questions/` retrieve information and never modify application state.
- `components/` group reusable UI-shell behavior without embedding test logic.
- `utils/` contains generic helpers only; it should not include browser logic.

`tests/regression`, `tests/e2e`, and `tests/generated` are reserved for future suites and AI-generated specifications.

## Design

```text
Playwright fixture → Actor + BrowseTheWeb
                         ↓
                 Tasks / Flows (business intent)
                         ↓
                  Interactions (one UI action)
                         ↓
            Pages → Target → Playwright Locator
                         ↑
              Questions / Assertions (read-only checks)
```

Locators live only in `pages/` and use accessible roles, labels, placeholders, or `data-test` attributes. There are no XPath selectors or fixed waits; Playwright locator assertions and actions provide auto-waiting.

### SOLID in practice

- **Single responsibility:** interactions execute one UI operation; questions only read state; tasks only express a business action.
- **Open/closed:** add a new task, question, or ability without changing Actor or existing workflows.
- **Liskov substitution:** every task and interaction conforms to `Performable` and can be composed by `Actor.attemptsTo`.
- **Interface segregation:** `Ability`, `Performable`, and `Question<T>` stay minimal and purpose-specific.
- **Dependency inversion:** tasks depend on `Target` and actor capabilities, not Playwright pages or test fixtures directly; `BrowseTheWeb` injects the page at the edge.

Composition is preferred over inheritance: `Purchase.product(...)` combines tasks, and `Task.where(...)` combines interactions. This keeps AI-generated code short, deterministic, and easy to review.

## Reporting and CI

HTML reports are written to `apps/automation/playwright-report`; JUnit XML to `apps/automation/results/junit.xml`. Screenshots, videos, and traces are retained on failures under `test-results` and uploaded by `.github/workflows/ui-automation.yml`. CI runs linting, type checks, and each browser in a separate matrix job on pull requests and pushes to `main`.

## Standards

- Files use lowercase kebab-case; types/classes use PascalCase; functions and data use camelCase.
- Tests describe observable business outcomes and carry suite tags such as `@smoke`.
- Keep selectors out of tests and tasks. Add an element target first.
- Keep interactions atomic; compose them into a task or flow instead of duplicating steps.
- Format with `pnpm format`; validate with `pnpm format:check`, `pnpm lint`, and `pnpm --filter @qa/automation build`.
