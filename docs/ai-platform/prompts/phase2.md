You are a Senior Software Engineer building an enterprise AI QA Automation Platform.

Implement Phase 2 only.

Do NOT implement future phases.

==================================================
GOAL
==================================================

Build the Project Context module.

The purpose of this module is to transform the ProjectStructure
generated in Phase 1 into a compact ProjectContext that can later
be used by AI agents.

This module should contain NO AI logic.

It should only prepare structured information.

==================================================
TECH STACK
==================================================

- Node.js
- TypeScript
- Clean Architecture

==================================================
INPUT
==================================================

ProjectStructure

Produced by ProjectAnalyzer.

==================================================
OUTPUT
==================================================

ProjectContext

Example

{
framework: "Playwright",

    architecture: "Screenplay",

    codingStyle: {
        asyncAwait: true,
        assertionLibrary: "Playwright Expect"
    },

    folders: {},

    pages: [],

    tasks: [],

    questions: [],

    interactions: [],

    components: [],

    fixtures: [],

    utilities: [],

    namingConventions: {},

    reusableObjects: [],

    imports: {},

    dependencies: {}

}

==================================================
RESPONSIBILITIES
==================================================

Create services responsible for

- extracting reusable project information

- identifying coding conventions

- identifying naming conventions

- identifying reusable components

- detecting project architecture

- preparing context for future AI agents

==================================================
CREATE
==================================================

apps/

    ai-platform/

        src/

            context/

                ProjectContext.ts

                ContextBuilder.ts

                ContextValidator.ts

                ContextSerializer.ts

            services/

                NamingConventionService.ts

                ImportAnalyzer.ts

                DependencyMapper.ts

                ReusableCodeDetector.ts

                CodingStyleAnalyzer.ts

==================================================
REQUIREMENTS
==================================================

The Context Builder must

Determine

- naming conventions

- import style

- folder conventions

- async usage

- assertion style

- locator style

- Playwright best practices

- Screenplay conventions

Identify

Reusable

Pages

Tasks

Questions

Interactions

Components

Fixtures

==================================================
VALIDATION
==================================================

Validate that

Every detected object exists

No duplicates exist

The context is internally consistent

==================================================
OUTPUT FORMAT
==================================================

Return ProjectContext as structured JSON.

==================================================
README
==================================================

Generate documentation explaining

Purpose

Architecture

Responsibilities

Future extension points

How AI agents will use this module

==================================================
LOGGING
==================================================

Use the centralized logger.

Log

Context building started

Detected conventions

Detected reusable objects

Validation results

Execution time

==================================================
IMPORTANT
==================================================

Do NOT integrate OpenAI.

Do NOT generate prompts.

Do NOT generate code.

Do NOT modify project files.

Build only the Project Context layer.
