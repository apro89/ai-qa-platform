# Phase 7 Quick Reference

## Basic Usage

```typescript
import { ValidationEngine } from '@automation/validation/services/ValidationEngine.js';

// Create engine
const engine = new ValidationEngine();

// Optional: Initialize with project context
engine.initializeWithProjectContext({
  existingTasks: ['LoginTask'],
  existingQuestions: [],
  existingPages: ['LoginPage'],
  existingFiles: [],
  forbiddenPaths: [],
});

// Validate generated files
const result = await engine.validate(generationResult);

// Check if ready to proceed to Phase 8
if (result.readyToWrite) {
  // Safe to write approved files
  const approvedFiles = result.approvedFiles;
} else {
  // Review violations and fix issues
  console.log(result.report.summary);
  console.log(result.errors);
}
```

## Output Structure

```typescript
ValidatedGeneration {
  approvedFiles: [...]      // ✅ Ready to write
  rejectedFiles: [...]      // ❌ Have errors
  isValid: boolean          // No critical errors
  qualityScore: 0-100       // Quality percentage
  readyToWrite: boolean     // Safe for Phase 8
  violations: [...]         // All issues found
  warnings: [...]           // Non-blocking
  errors: [...]             // Critical blockers
  report: {
    summary,                // Human-readable
    byCategory,             // Grouped by type
    bySeverity,             // Grouped by level
    byFile,                 // Grouped by file
    scoreBreakdown,         // Points per category
    recommendations         // Fixing advice
  }
  executionTimeMs: number
  metadata: {...}
}
```

## Validation Levels

| Severity | Impact         | Example                           |
| -------- | -------------- | --------------------------------- |
| ERROR    | ❌ Blocks file | Duplicate name, forbidden pattern |
| WARNING  | ⚠️ Warns       | Missing suffix, long line         |
| INFO     | ℹ️ Suggests    | Unused import, low comments       |

## Common Validations

### Naming Conventions

- Task files must end with `Task.ts`
- Question files must end with `Question.ts`
- Page files should end with `Page.ts`
- All use PascalCase

### Screenplay Pattern

- Tasks extend `Task` class
- Tasks have `async perform(actor)` method
- Questions extend `Question` class
- No direct `page.click()` in Tasks (use Interactions)
- Proper Actor usage

### Imports

- Must use `.js` extensions (`@automation/path/file.js`)
- No duplicate imports
- No circular imports
- No self-referential imports

### File Paths

- Valid extensions only (.ts, .js, .md, .json)
- Allowed top-level folders (tasks, questions, pages, etc.)
- No double slashes, trailing slashes
- Must include filename

## Quality Scoring

Points breakdown (total 100):

- Naming: 25 pts
- Architecture: 25 pts
- Imports: 20 pts
- Code Structure: 20 pts
- Safety: 10 pts

Deductions:

- ERROR: -15 pts each
- WARNING: -5 pts each
- INFO: -1 pt each

## Advanced Usage

### Custom Validator

```typescript
class MyValidator {
  validate(file: GeneratedFile): ValidationRule[] {
    // Return violations
  }
}

engine.getPipeline().register('MyValidator', new MyValidator());
```

### Custom Validator Order

```typescript
engine.getPipeline().setOrder([
  'FilePathValidator',
  'NamingConventionValidator',
  'ScreenplayValidator',
  'MyCustomValidator',
  // ...other validators
]);
```

### Disable Validator

```typescript
engine.getPipeline().unregister('CodeQualityValidator');
```

### Custom Rule

```typescript
import { ValidationRuleFactory } from '@automation/validation/models/ValidationRule.js';

const rule = ValidationRuleFactory.createError(
  'MY_RULE_ID',
  'My Rule',
  'Description of issue',
  'my-category',
  'Suggestion to fix',
  file,
);
```

## Typical Workflow

```
1. Generate code (Phase 6) → GenerationResult
2. Validate code (Phase 7) → ValidatedGeneration
3. If readyToWrite:
   ✅ Write to filesystem (Phase 8)
   ✅ Create branch, commit, push
   ✅ Create PR
4. If not readyToWrite:
   ❌ Show violations
   ❌ Ask LLM to regenerate
   ❌ Re-validate
```

## Performance Tips

- Validation is fast: typically < 100ms per file
- Largest cost: TypeScript syntax checking
- Quality scoring is O(n) where n = violations
- Pipeline is parallelizable (future enhancement)

## Error Handling

All errors are caught and logged. The validation never crashes:

- Invalid input returns appropriate errors
- Validator exceptions don't stop pipeline
- Missing project context doesn't block validation

## File Structure

```
validation/
├── models/
│   ├── ValidationSeverity.ts
│   ├── ValidationRule.ts
│   ├── ValidationResult.ts
│   ├── ValidatedGeneration.ts
│   └── index.ts
├── validators/
│   ├── FilePathValidator.ts
│   ├── NamingConventionValidator.ts
│   ├── ImportValidator.ts
│   ├── ScreenplayValidator.ts
│   ├── TypeScriptValidator.ts
│   ├── CodeQualityValidator.ts
│   ├── DuplicateDetector.ts
│   ├── ProjectConflictDetector.ts
│   └── index.ts
├── services/
│   ├── ValidationPipeline.ts
│   ├── ValidationEngine.ts
│   └── index.ts
├── errors/
│   ├── ValidationEngineError.ts
│   └── index.ts
├── __tests__/
│   └── ValidationEngine.test.ts
├── index.ts
└── README.md
```

## Integration Points

**Input from:** Phase 6 (GenerationResult)
**Output to:** Phase 8 (ValidatedGeneration → FileSystemWriter)
**Context from:** Phase 1-5 (project structure, existing artifacts)

## Next Phase (Phase 8)

Phase 8 Filesystem Writer will:

- Receive `approvedFiles` from ValidatedGeneration
- Create new files safely
- Update existing files with care
- Generate FileSystemWriteResult
- No validation decisions in Phase 8 (all made in Phase 7)

---

For full documentation see [README.md](./README.md)
