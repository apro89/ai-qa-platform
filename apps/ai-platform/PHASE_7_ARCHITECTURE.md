# Phase 7 Architecture Deep Dive

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 7: VALIDATION LAYER                       │
│                                                                         │
│                          ValidationEngine (Main Orchestrator)           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  • Entry point for all validation                               │  │
│  │  • Initializes project context (existing files, artifacts)      │  │
│  │  • Coordinates all validators                                   │  │
│  │  • Generates reports and quality scores                         │  │
│  │  • Returns ValidatedGeneration result                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│          ┌─────────────────────────┼─────────────────────────┐          │
│          │                         │                         │          │
│          ▼                         ▼                         ▼          │
│  ┌───────────────┐      ┌──────────────────┐     ┌─────────────────┐  │
│  │Validation     │      │  DuplicateDetector│    │ProjectConflict  │  │
│  │Pipeline       │      │  • Existing Tasks │    │Detector         │  │
│  │  Sequential   │      │  • Existing Qs    │    │ • File conflicts│  │
│  │  Validators   │      │  • Existing Pages │    │ • Forbidden     │  │
│  │               │      │  • Name conflicts │    │   paths         │  │
│  └───────────────┘      └──────────────────┘    └─────────────────┘  │
│          │                                                               │
│  ┌───────┴──────────────────────────────────────────────────────────┐  │
│  │                                                                  │  │
│  ├─► FilePathValidator                                             │  │
│  │    ✓ File extensions (.ts, .js)                                │  │
│  │    ✓ Folder structure (tasks/, questions/, etc.)               │  │
│  │    ✓ Path format (no //,  no trailing /)                       │  │
│  │    ✓ Type-folder matching                                      │  │
│  │                                                                  │  │
│  ├─► NamingConventionValidator                                     │  │
│  │    ✓ PascalCase enforcement                                    │  │
│  │    ✓ Task/Question/Page suffixes                               │  │
│  │    ✓ Descriptive names                                         │  │
│  │                                                                  │  │
│  ├─► ImportValidator                                               │  │
│  │    ✓ Duplicate imports                                         │  │
│  │    ✓ Circular imports                                          │  │
│  │    ✓ Self-referential imports                                  │  │
│  │    ✓ .js extensions                                            │  │
│  │    ✓ Unused imports                                            │  │
│  │                                                                  │  │
│  ├─► ScreenplayValidator                                           │  │
│  │    ✓ Base class inheritance                                    │  │
│  │    ✓ Required methods (perform, answeredBy)                    │  │
│  │    ✓ Forbidden patterns (page.click in Task)                   │  │
│  │    ✓ Actor parameter usage                                     │  │
│  │    ✓ Proper dependencies                                       │  │
│  │                                                                  │  │
│  ├─► TypeScriptValidator                                           │  │
│  │    ✓ Matching braces { }                                       │  │
│  │    ✓ Matching parentheses ( )                                  │  │
│  │    ✓ Unclosed strings                                          │  │
│  │    ✓ Type annotations                                          │  │
│  │    ✓ 'any' type usage                                          │  │
│  │    ✓ Export statements                                         │  │
│  │                                                                  │  │
│  ├─► CodeQualityValidator                                          │  │
│  │    ✓ Line length (max 120 chars)                               │  │
│  │    ✓ Function length (max 50 lines)                            │  │
│  │    ✓ Comment coverage                                          │  │
│  │    ✓ Naming consistency                                        │  │
│  │                                                                  │  │
│  └─► (More validators easily added)                               │  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
Input:
  GenerationResult {
    success: boolean,
    generatedFiles: [
      { path, type, content },
      { path, type, content },
      ...
    ]
  }

Project Context:
  {
    existingTasks: [...],
    existingQuestions: [...],
    existingPages: [...],
    existingFiles: [...],
    forbiddenPaths: [...]
  }

         │
         ▼
    ┌─────────────┐
    │Validation   │
    │Engine       │
    │             │
    │ per file:   │
    └─────────────┘
         │
    ┌────┴────────────────────────────┐
    │ For each GeneratedFile:         │
    ▼                                 ▼
┌──────────────────┐        ┌────────────────────┐
│ValidationPipeline│        │Detectors           │
│                  │        │ • Duplicate?       │
│Execute validators│        │ • Conflicts?       │
│sequentially      │        │ • Forbidden?       │
└──────────────────┘        └────────────────────┘
    │                              │
    └──────────────┬───────────────┘
                   │
                   ▼
            Violations: [
              { ruleId, severity, message },
              { ruleId, severity, message },
              ...
            ]
                   │
                   ▼
          Per-File ValidationResult
            {
              file,
              isValid,
              violations,
              qualityScore,
              readyToWrite
            }
                   │
                   ▼
         Aggregate per-file results
                   │
                   ▼
         ┌─────────────────────────┐
         │ ValidatedGeneration     │
         │                         │
         │ approvedFiles: [...]    │ ✅
         │ rejectedFiles: [...]    │ ❌
         │ isValid: boolean        │
         │ qualityScore: 0-100     │
         │ readyToWrite: boolean   │
         │ report: {               │
         │   summary,              │
         │   byCategory,           │
         │   bySeverity,           │
         │   byFile,               │
         │   scoreBreakdown,       │
         │   recommendations       │
         │ }                       │
         └─────────────────────────┘
                   │
                   ▼
           Phase 8: Filesystem Writer
           (if readyToWrite = true)
```

## Component Responsibilities

### ValidationEngine

**Purpose:** Main orchestrator and entry point

**Responsibilities:**

- Initialize with project context
- Coordinate validation pipeline
- Manage duplicate and conflict detectors
- Calculate overall quality score
- Generate comprehensive report
- Produce ValidatedGeneration output

**Key Methods:**

- `initializeWithProjectContext(config)` - Setup with project knowledge
- `validate(generationResult): ValidatedGeneration` - Main validation method
- `getPipeline()` - Access pipeline for customization
- `getDuplicateDetector()` - Configure duplicate detection
- `getConflictDetector()` - Configure conflict detection

### ValidationPipeline

**Purpose:** Execute validators sequentially

**Responsibilities:**

- Register/unregister validators
- Execute validators in specified order
- Collect violations
- Calculate quality score
- Handle validator errors gracefully
- Produce per-file ValidationResult

**Key Methods:**

- `register(name, validator)` - Add validator
- `unregister(name)` - Remove validator
- `setOrder(order)` - Customize execution order
- `validate(file): ValidationResult` - Validate single file
- `getValidators()` - List active validators

### Validators (All implement same pattern)

**Interface:**

```typescript
interface Validator {
  validate(file: GeneratedFile): ValidationRule[];
}
```

**Pattern:**

- Take GeneratedFile as input
- Return array of ValidationRules
- Independent operation (no shared state)
- Graceful error handling

### DuplicateDetector

**Purpose:** Detect duplicate objects in the project

**Detects:**

- Tasks with same name (ERROR)
- Questions with same name (ERROR)
- Pages with same name (ERROR)
- Interactions with similar names (WARNING)

### ProjectConflictDetector

**Purpose:** Detect filesystem and policy conflicts

**Detects:**

- File path conflicts (existing file) (ERROR)
- Forbidden paths (ERROR)
- Invalid folder structure (WARNING)

## Quality Score Calculation

```
Starting Score: 100

For each violation:
  if severity === ERROR:
    score -= 15
  else if severity === WARNING:
    score -= 5
  else if severity === INFO:
    score -= 1

Final Score = max(0, min(100, calculated_score))

Score Breakdown (for reporting):
  naming: 25
  architecture: 25
  imports: 20
  syntax: 20
  code-quality: 10

  (Each category reduced by violations in that category)
```

## Validation Report Generation

```
Per-File Results
    │
    ├─► Group by Category
    │   naming: [violations...]
    │   architecture: [violations...]
    │   imports: [violations...]
    │   syntax: [violations...]
    │   code-quality: [violations...]
    │
    ├─► Group by Severity
    │   error: [violations...]
    │   warning: [violations...]
    │   info: [violations...]
    │
    ├─► Group by File
    │   file1.ts: [violations...]
    │   file2.ts: [violations...]
    │
    ├─► Calculate Score Breakdown
    │   naming: 25 - (errors*5 + warnings*1)
    │   architecture: 25 - (errors*5 + warnings*1)
    │   ...
    │
    └─► Generate Recommendations
        "Fix X rejected files"
        "Duplicate task detected"
        "Ensure all files use .ts extension"
        ...

Result: ValidationReport
```

## Error Handling Strategy

```
ValidationEngine
    │
    ├─► For each file:
    │   │
    │   ├─► Run ValidationPipeline
    │   │   │
    │   │   ├─► For each validator:
    │   │   │   │
    │   │   │   ├─ Try execution
    │   │   │   │
    │   │   │   └─ Catch: log error, continue
    │   │   │
    │   │   └─ Return ValidationResult
    │   │
    │   └─► If validation exception:
    │       Add to violations, continue
    │
    └─► Aggregate results → ValidatedGeneration

Result: All files validated, no crashes
```

## Extension Architecture

```
New Validator Addition:

1. Create validator class
   class MyValidator {
     validate(file): ValidationRule[]
   }

2. Register with pipeline
   pipeline.register('MyValidator', new MyValidator())

3. No changes needed to Engine, Pipeline, or other validators
   (Open/Closed Principle - open for extension, closed for modification)

Same for custom rules:
   ValidationRuleFactory.createError(...)
```

## Performance Characteristics

```
Per File:
  FilePathValidator: ~1ms
  NamingConventionValidator: ~1ms
  ImportValidator: ~5ms (parses imports)
  ScreenplayValidator: ~3ms
  TypeScriptValidator: ~5ms (checks syntax)
  CodeQualityValidator: ~3ms
  DuplicateDetector: O(n) existing items
  ProjectConflictDetector: O(n) existing items

  Total per file: ~20-30ms average

For 5 files: ~150ms
For 10 files: ~300ms

Pipeline is parallelizable (future):
  Could reduce 10 files from 300ms to ~50ms with parallel execution
```

## Integration Points

```
Phase 6 (LLM Generation)
        ↓
        GenerationResult
        ↓
Phase 7 (This Layer)
        ↓
        ValidatedGeneration
        (approvedFiles only)
        ↓
Phase 8 (Filesystem Writer)
        ↓
        FileSystemWriteResult
        ↓
Phase 5 (Git Automation)
```

## State Management

```
ValidationEngine
  ├─ ValidationPipeline (stateless)
  │   └─ Validators (stateless)
  │
  ├─ DuplicateDetector (maintains project state)
  │   └─ existingTasks, existingQuestions, etc.
  │
  └─ ProjectConflictDetector (maintains project state)
      └─ existingFiles, forbiddenPaths

No cross-file state between validations
Each file validation is independent
Results are aggregated afterward
```

This architecture ensures:

- **Safety**: All decisions made before filesystem changes
- **Clarity**: Each validator has single responsibility
- **Flexibility**: Easy to add, remove, or modify validators
- **Performance**: Fast validation with room for parallelization
- **Maintainability**: SOLID principles throughout
