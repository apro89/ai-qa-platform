You are a Principal Software Architect and Senior TypeScript Engineer.

Implement Phase 7 of an enterprise AI QA Automation Platform.

IMPORTANT

Implement ONLY Phase 7.

Do NOT call any LLM.

Do NOT generate Playwright code.

Do NOT write files.

Do NOT integrate Git.

The input is already a validated GenerationResult.

==================================================
GOAL
==================================================

Build the Validation & Quality Engine.

Its responsibility is to inspect generated code before
anything is written to the project.

This module acts as the quality gate between AI generation
and the filesystem.

==================================================
CURRENT ARCHITECTURE
==================================================

GenerationResult

↓

Validation & Quality Engine

↓

ValidatedGeneration

↓

Filesystem Writer (future)

==================================================
INPUT
==================================================

GenerationResult

Example

{

generatedFiles: [

{

path: "tasks/LoginTask.ts",

type: "task",

content: "..."

}

]

}

==================================================
OUTPUT
==================================================

ValidatedGeneration

Example

{

approvedFiles: [...],

rejectedFiles: [...],

warnings: [...],

errors: [...],

qualityScore: 96,

readyToWrite: true

}

==================================================
CREATE
==================================================

apps/

    ai-platform/

        src/

            validation/

                ValidationEngine.ts

                ValidationPipeline.ts

                ValidationResult.ts

                ValidatedGeneration.ts

                ValidationReport.ts

                ValidationRule.ts

                ValidationSeverity.ts

==================================================
CREATE SERVICES
==================================================

ValidationEngine

ValidationPipeline

CodeQualityValidator

NamingConventionValidator

ImportValidator

ScreenplayValidator

DuplicateDetector

ProjectConflictDetector

FilePathValidator

TypeScriptValidator

==================================================
RESPONSIBILITIES
==================================================

ValidationEngine

Coordinates all validation rules.

ValidationPipeline

Runs validators sequentially.

Each validator should be independent.

==================================================
VALIDATORS
==================================================

NamingConventionValidator

Validate

Page names

Task names

Question names

Interaction names

Component names

==================================================

ImportValidator

Validate

Imports exist

No duplicate imports

No circular imports

==================================================

ScreenplayValidator

Validate

Correct Screenplay structure

Proper Actor usage

Tasks use Interactions

Questions return values correctly

==================================================

DuplicateDetector

Detect

Existing Tasks

Existing Pages

Existing Questions

Existing Components

Avoid generating duplicates.

==================================================

ProjectConflictDetector

Detect

Existing file conflicts

Path conflicts

Potential overwrites

==================================================

FilePathValidator

Validate

Folder exists

Extension correct

Allowed location

==================================================

TypeScriptValidator

Validate

Syntax

Basic compilation

No obvious TypeScript errors

==================================================
QUALITY SCORE
==================================================

Calculate

Quality Score

0 - 100

Example

Naming

25

Architecture

25

Imports

20

Code Structure

20

Safety

10

==================================================
VALIDATION REPORT
==================================================

Return detailed report.

Example

✔ Naming

✔ Imports

✔ Screenplay

⚠ Duplicate LoginTask detected

✖ Existing file conflict

==================================================
ERRORS
==================================================

Create

ValidationError

DuplicateObjectError

ImportValidationError

ScreenplayValidationError

TypeScriptValidationError

ConflictError

==================================================
LOGGING
==================================================

Use centralized logging.

Log

Validation started

Validator executed

Warnings

Errors

Quality score

Execution time

==================================================
TESTS
==================================================

Create unit tests.

Test

Duplicate detection

Naming validation

Import validation

Screenplay validation

Conflict detection

Quality score calculation

==================================================
README
==================================================

Generate documentation explaining

Validation architecture

Pipeline

Rules

Quality scoring

Future extension points

==================================================
IMPORTANT
==================================================

Do NOT write files.

Do NOT modify existing files.

Do NOT execute Git.

Do NOT call the LLM.

Return only ValidatedGeneration.

Follow

Clean Architecture

SOLID

Pipeline Pattern

Open/Closed Principle

Each validator must be independently extendable.
