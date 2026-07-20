# Validation & Quality Engine (Phase 7)

This module implements the **Validation & Quality Gate** for the AI QA Automation Platform.

## Architecture

```
GenerationResult (Phase 6)
        │
        ▼
ValidationEngine
        │
        ├─► ValidationPipeline (sequential validators)
        │   ├─► FilePathValidator
        │   ├─► NamingConventionValidator
        │   ├─► ImportValidator
        │   ├─► ScreenplayValidator
        │   ├─► TypeScriptValidator
        │   └─► CodeQualityValidator
        │
        ├─► DuplicateDetector
        └─► ProjectConflictDetector
        │
        ▼
ValidatedGeneration
        │
        ▼
Filesystem Writer (Phase 8)
```

## Purpose

The Validation & Quality Engine acts as the **quality gate** between AI generation and the filesystem. All generated code must pass through this layer to ensure:

- **Safety**: No conflicts with existing code
- **Consistency**: Follows project conventions and Screenplay Pattern
- **Quality**: Code meets quality standards and best practices
- **Reliability**: Proper structure and no obvious errors

## Core Components

### ValidationEngine

Orchestrates all validation activities. Main entry point for Phase 7.

```typescript
const engine = new ValidationEngine();

// Initialize with project context
engine.initializeWithProjectContext({
  existingTasks: ['LoginTask', 'LogoutTask'],
  existingQuestions: ['IsLoginSuccessfulQuestion'],
  existingFiles: [...]
});

// Validate generated files
const result = await engine.validate(generationResult);
```

### ValidationPipeline

Executes validators sequentially. Each validator is independent.

```typescript
const pipeline = engine.getPipeline();

// Register custom validator
pipeline.register('MyValidator', new MyValidator());

// Change execution order
pipeline.setOrder(['FilePathValidator', 'NamingConventionValidator', ...]);
```

### Validators

#### FilePathValidator

- Validates file extensions
- Checks folder structure
- Ensures files are in correct locations
- Validates path format

#### NamingConventionValidator

- Validates PascalCase naming
- Checks Task/Question/Page/Interaction suffixes
- Validates descriptive names

#### ImportValidator

- Detects duplicate imports
- Checks for circular imports
- Validates import paths
- Ensures .js extensions

#### ScreenplayValidator

- Validates base class inheritance
- Checks for required methods
- Prevents forbidden patterns (page.click in Tasks)
- Validates Actor usage
- Ensures proper dependencies

#### TypeScriptValidator

- Checks syntax (matching braces, parentheses)
- Validates type annotations
- Checks for 'any' type usage
- Validates exports

#### CodeQualityValidator

- Checks line length (max 120 chars)
- Validates function length (max 50 lines)
- Checks comment coverage
- Validates naming consistency

#### DuplicateDetector

- Detects existing Tasks/Questions/Pages
- Prevents duplicate object creation
- Warns about name conflicts

#### ProjectConflictDetector

- Checks file path conflicts
- Detects forbidden paths
- Validates folder structure

## Validation Levels

### Errors (Severity: ERROR)

- Blocks file approval
- Critical issues that prevent generation
- Examples: duplicate names, forbidden patterns, syntax errors

### Warnings (Severity: WARNING)

- Doesn't block approval
- Non-critical issues that should be reviewed
- Examples: long lines, potential improvements

### Info (Severity: INFO)

- Informational messages
- Suggestions for improvement
- Examples: unused imports, low comment coverage

## Quality Score

- **Range**: 0-100
- **Calculation**: Based on violation counts and severity
- **Breakdown**:
  - Naming: 25 points
  - Architecture: 25 points
  - Imports: 20 points
  - Code Structure: 20 points
  - Safety: 10 points

## Output Model

### ValidatedGeneration

```typescript
interface ValidatedGeneration {
  approvedFiles: GeneratedFile[];      // Files that passed validation
  rejectedFiles: GeneratedFile[];      // Files that failed validation
  isValid: boolean;                    // No critical errors
  qualityScore: number;                // 0-100
  readyToWrite: boolean;               // Safe to write to filesystem
  violations: ValidationRule[];        // All violations found
  warnings: ValidationRule[];          // Non-critical issues
  errors: ValidationRule[];            // Critical issues
  report: ValidationReport;            // Detailed report
  executionTimeMs: number;             // Performance metric
  metadata: {...};                     // Statistics
}
```

## ValidationReport

```typescript
interface ValidationReport {
  summary: string;                     // Human-readable summary
  byCategory: {...};                   // Violations grouped by category
  bySeverity: {...};                   // Violations grouped by severity
  byFile: {...};                       // Violations grouped by file
  scoreBreakdown: {...};               // Score by category
  recommendations: string[];           // Fixing recommendations
}
```

## Usage

### Basic Usage

```typescript
import { ValidationEngine } from '@automation/validation/services/ValidationEngine.js';

const engine = new ValidationEngine();
const validatedResult = await engine.validate(generationResult);

if (validatedResult.readyToWrite) {
  // Proceed to Phase 8: Filesystem Writer
} else {
  console.log(validatedResult.report.summary);
  console.log(validatedResult.errors);
}
```

### Advanced Usage

```typescript
// Initialize with project context
engine.initializeWithProjectContext({
  existingTasks: ['LoginTask'],
  forbiddenPaths: ['core/', 'internal/'],
});

// Get pipeline for custom configuration
const pipeline = engine.getPipeline();
pipeline.unregister('CodeQualityValidator'); // Disable validator

// Validate individual file
const fileValidation = await pipeline.validate(file);
```

## Extension Points

### Custom Validators

```typescript
class MyValidator {
  validate(file: GeneratedFile): ValidationRule[] {
    // Return violations
    return [];
  }
}

const pipeline = engine.getPipeline();
pipeline.register('MyValidator', new MyValidator());
```

### Custom Rules

```typescript
import { ValidationRuleFactory } from '@automation/validation/models/ValidationRule.js';

const rule = ValidationRuleFactory.createError(
  'MY_RULE_ID',
  'My Rule Name',
  'Description of the violation',
  'category',
  'Suggestion for fixing',
  file,
);
```

## Error Handling

All validation errors are handled gracefully:

- Validator failures don't stop pipeline
- Exceptions are logged but continue validation
- Invalid GenerationResult is detected and reported

## Performance

- Validation is fast (typically <100ms per file)
- Pipeline is parallelizable (currently sequential)
- Quality score calculation is O(n) where n = violations count

## SOLID Principles

- **Single Responsibility**: Each validator has one job
- **Open/Closed**: New validators can be added without modification
- **Liskov Substitution**: All validators follow same interface
- **Interface Segregation**: ValidationRule contains only needed fields
- **Dependency Inversion**: Engine depends on abstractions (Validator interface)

## Next Steps (Phase 8)

The `ValidatedGeneration` is passed to the **Filesystem Writer** which:

1. Receives `approvedFiles`
2. Creates new files
3. Updates existing files (if allowed)
4. Generates report
5. Returns `FileSystemWriteResult`

## Testing

Run validation tests:

```bash
pnpm test -- validation
```

## Logging

The ValidationEngine uses centralized logging:

```
[INFO] Validation started for 2 files
[DEBUG] FilePathValidator: Checking paths...
[DEBUG] NamingConventionValidator: Checking names...
[WARN] ImportValidator: Missing .js extension on line 5
[ERROR] ScreenplayValidator: Task not extending Task class
[INFO] Validation completed in 45ms - Quality: 75%
```
