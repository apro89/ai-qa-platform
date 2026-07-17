# Project Context Module (Phase 2)

## Purpose

Transform `ProjectStructure` (Phase 1 output) into a compact, AI-agent-friendly `ProjectContext`.

```
Phase 1: ProjectStructure
         (detailed analysis)
              │
              ▼
Phase 2: ProjectContext
         (compact, AI-ready)
              │
              ▼
Phase 3+: AI Agents
         (use context for reasoning)
```

## Architecture

### Input
- **ProjectStructure** from Phase 1 (ProjectAnalyzer)
- **ScannedProject** raw file data

### Processing Pipeline

```
ProjectStructure + ScannedProject
         │
         ├─→ NamingConventionService     (identify naming patterns)
         ├─→ CodingStyleAnalyzer        (detect async, assertions, locators)
         ├─→ ImportAnalyzer              (map import patterns)
         ├─→ DependencyMapper            (categorize dependencies)
         ├─→ ReusableCodeDetector        (identify reusable components)
         │
         └─→ ContextBuilder              (orchestrate)
              │
              ├─→ Validate               (ContextValidator)
              ├─→ Serialize              (ContextSerializer)
              │
              └─→ ProjectContext (JSON)
```

### Output

```typescript
interface ProjectContext {
  // Framework metadata
  framework: "Playwright"
  frameworkVersion: "1.40.0"
  typescriptVersion: "5.3.0"
  architecture: "screenplay" | "page-object-model" | "hybrid"
  supportedArchitectures: string[]

  // Project structure
  folderStructure: {}
  pages: ArtifactRef[]
  tasks: ArtifactRef[]
  interactions: ArtifactRef[]
  questions: ArtifactRef[]
  components: ArtifactRef[]
  fixtures: ArtifactRef[]
  utilities: ArtifactRef[]

  // Conventions and style
  namingConventions: {
    pages: { pattern, examples, description }
    tasks: { pattern, examples, description }
    tests: { pattern, examples, description }
    // ... more
  }

  codingStyle: {
    asyncAwait: true
    assertionLibrary: "Playwright Expect"
    locatorStyle: "getByRole"
    importStyle: "absolute" | "relative" | "mixed"
    moduleSyntax: "esm" | "cjs"
    typeScriptUsage: true
    decoratorsUsed: false
  }

  // Reusable patterns
  reusableObjects: ReusableObject[]
  commonPatterns: string[]

  // Dependencies and imports
  importPatterns: ImportPattern[]
  topDependencies: DependencyInfo[]

  // Metadata
  metadata: {
    builtAt: ISO8601
    projectRoot: string
    totalArtifacts: number
    totalDependencies: number
  }
}
```

## Service Responsibilities

### NamingConventionService
Analyzes file and class naming patterns.

```typescript
analyzer.analyzePagesNaming(paths)
// → { pattern: "PascalCase", examples: [...], description: "..." }
```

Detects:
- **Pages**: `LoginPage`, `DashboardPage`
- **Tasks**: `LoginTask`, `CreateOrderTask`
- **Tests**: `login.spec.ts`, `create-order.spec.ts`
- **Interactions**: `Click`, `FillField`, `SelectOption`
- **Questions**: `TextOf`, `CurrentURL`, `CartBadge`
- **Components**: `Button`, `Modal`, `FormField`
- **Files**: `camelCase`, `kebab-case`, extensions

### CodingStyleAnalyzer
Analyzes code patterns to determine conventions.

```typescript
const style = analyzer.analyze(scannedProject)
// → { asyncAwait: true, assertionLibrary: "Playwright Expect", ... }
```

Detects:
- TypeScript usage (`.ts` files present)
- Async/await patterns
- Assertion libraries (Playwright, Chai, Jest)
- Locator styles (getByRole, getByTestId, locator(), querySelector)
- Import patterns (absolute vs relative)
- Module syntax (ESM vs CommonJS)
- Decorator usage (@decorators)

### ImportAnalyzer
Maps how modules are imported across the project.

```typescript
const patterns = analyzer.analyzeImportPatterns(scannedProject)
// → [{ source: "@qa/tasks", targets: [...], frequency: 24, percentage: 15.2 }, ...]
```

Identifies:
- Top imported modules
- Internal vs external imports
- Import frequency
- Common import chains

### DependencyMapper
Categorizes and interprets dependencies.

```typescript
const deps = mapper.mapDependencies(structure.dependencies)
// → [{ name: "@playwright/test", version: "1.40.0", scope: "devDependencies", purpose: "..." }, ...]
```

Categorizes by:
- Framework dependencies (Playwright, test runners)
- Tool dependencies (ESLint, Prettier, TypeScript)
- QA dependencies (assertions, mocking)
- Purpose and description

### ReusableCodeDetector
Identifies reusable components and common patterns.

```typescript
const reusable = detector.detectReusableObjects(structure)
// → [{ type: 'page', name: 'LoginPage', path: '...', relatedObjects: [...] }, ...]

const patterns = detector.detectCommonPatterns(structure)
// → ['Screenplay Pattern', 'Page Object Model', 'Data Builder Pattern', ...]
```

Identifies:
- Pages and their relationships
- Tasks used by multiple tests
- Reusable interactions
- Common pattern usage (Screenplay, POM, fixtures, builders)

### ContextValidator
Validates context consistency and completeness.

```typescript
const result = validator.validate(context)
// → { valid: true, errors: [], warnings: [...] }
```

Validates:
- All required fields present
- No duplicate artifacts
- Reference integrity
- Naming conventions coverage

### ContextSerializer
Converts ProjectContext to different formats.

```typescript
// Full JSON
serializer.toJSON(context)

// Compact JSON
serializer.toCompactJSON(context)

// Human-readable Markdown
serializer.toMarkdown(context)
```

## Usage

### Basic Usage

```typescript
import { ContextBuilder } from '@qa/ai-platform/context';

// Build context from Phase 1 output
const builder = new ContextBuilder();
const context = await builder.build(projectStructure, scannedProject);

// Serialize to JSON
const json = builder.serialize(context, 'json');
const compact = builder.serialize(context, 'compact');
const markdown = builder.serialize(context, 'markdown');
```

### With Dependency Injection

```typescript
const builder = new ContextBuilder(
  new NamingConventionService(),
  new CodingStyleAnalyzer(),
  new ImportAnalyzer(),
  new DependencyMapper(),
  new ReusableCodeDetector(),
);

const context = await builder.build(structure, scannedProject);
```

## Logging

The module uses centralized logging. Run with debug flags:

```bash
pnpm dev --debug   # DEBUG level logs
pnpm dev --trace   # TRACE level logs (very detailed)
```

Example output:

```
[INFO] [ContextBuilder] Starting Project Context building
[DEBUG] [NamingConventionService] Analyzing page naming conventions
[TRACE] [NamingConventionService] Page naming analyzed
[DEBUG] [CodingStyleAnalyzer] Analyzing project coding style
[INFO] [CodingStyleAnalyzer] Coding style analysis completed
[INFO] [ContextBuilder] Project Context built
[DEBUG] [ContextValidator] Starting context validation
[INFO] [ContextValidator] Context validation completed
```

## Future Extension Points

### 1. Add New Analysis Services

```typescript
export class SecurityPatternDetector {
  public detectSecurityPatterns(context: ProjectContext): SecurityPatterns {
    // Analyze for security best practices
    // - Credentials handling
    // - Data masking
    // - Error message leakage
  }
}
```

### 2. Add New Serialization Formats

```typescript
class ContextSerializer {
  toYAML(context: ProjectContext): string { ... }
  toProtobuf(context: ProjectContext): Buffer { ... }
  toOpenTelemetry(context: ProjectContext): Trace { ... }
}
```

### 3. Add Caching Layer

```typescript
class CachedContextBuilder extends ContextBuilder {
  private cache: Map<string, ProjectContext>;

  async build(structure, scannedProject): Promise<ProjectContext> {
    const key = hash(structure);
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const context = await super.build(structure, scannedProject);
    this.cache.set(key, context);
    return context;
  }
}
```

### 4. Integrate with AI Agents (Phase 3+)

```typescript
// Phase 3: Use context to generate tests
class TestGenerationAgent {
  async generate(context: ProjectContext): Promise<TestCase[]> {
    // Analyze patterns
    // Use naming conventions
    // Follow coding style
    // Leverage reusable objects
  }
}
```

### 5. Context Diff and Evolution

```typescript
class ContextDiff {
  public diff(before: ProjectContext, after: ProjectContext): ContextChanges {
    // Track added/removed artifacts
    // Detect pattern changes
    // Monitor naming convention changes
  }
}
```

## Integration with Phase 1 & 3

### Phase 1 Integration
```
ProjectAnalyzer → ProjectStructure
                       ↓
ContextBuilder ← (consumes)
                       ↓
                 ProjectContext
```

### Phase 3 Integration (AI Agents)
```
ProjectContext
     ↓
    [AI Agent reads context]
     ├─→ Use framework info for correct imports
     ├─→ Follow naming conventions for new files
     ├─→ Respect coding style when generating code
     ├─→ Leverage reusable objects to avoid duplication
     ├─→ Follow detected patterns (Screenplay, POM, etc.)
     └─→ Understand project structure for file placement
```

## SOLID Principles

✅ **Single Responsibility**: Each service has one job  
✅ **Open/Closed**: Easy to add new analysis services  
✅ **Liskov Substitution**: All services follow same interface pattern  
✅ **Interface Segregation**: Services expose minimal contracts  
✅ **Dependency Inversion**: ContextBuilder depends on abstractions  

## Constraints

❌ No OpenAI integration  
❌ No code generation  
❌ No file modifications  
❌ No prompt building  

✅ Pure analysis and information extraction  
✅ Structured data output  
✅ Observable via logging  
✅ Testable and extensible  

## References

- Phase 1: [Project Intelligence Module](../README.md)
- Logging: [Centralized Logger](../logger/README.md)
- Models: [ProjectStructure](../models/project-structure.ts)
