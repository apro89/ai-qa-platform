You are a Senior Software Engineer building the first module of an AI QA Automation Platform.

The current task is to implement Phase 1 only.

Do NOT implement future phases.

==================================================
GOAL
==================================================

Build the Project Intelligence module.

This module will become the foundation for all future AI agents.

The AI must first understand the project before generating any code.

==================================================
TECH STACK
==================================================

- Node.js
- TypeScript
- Playwright
- Filesystem MCP
- Clean Architecture

==================================================
RESPONSIBILITIES
==================================================

Create a ProjectAnalyzer module.

The ProjectAnalyzer must:

1. Read the Playwright project using Filesystem MCP.

2. Scan all folders.

3. Detect

- Pages
- Components
- Tasks
- Questions
- Interactions
- Fixtures
- Tests
- Utilities
- Configurations

4. Detect framework information

- Playwright version
- TypeScript version
- Project structure
- Screenplay Pattern

5. Build an in-memory project model.

==================================================
OUTPUT
==================================================

Create a ProjectStructure model.

Example:

{
framework: {},
folders: {},
pages: [],
components: [],
tasks: [],
interactions: [],
questions: [],
fixtures: [],
tests: [],
utilities: [],
dependencies: [],
playwrightConfig: {},
packageInfo: {}
}

The output must be valid JSON.

==================================================
ARCHITECTURE
==================================================

Follow Clean Architecture.

Create

apps/
ai-platform/
src/

            agents/

            services/

            analyzers/

            models/

            interfaces/

            mcp/

            utils/

Separate responsibilities.

Do not mix filesystem access with business logic.

==================================================
SERVICES
==================================================

Create the following classes:

ProjectAnalyzer

FilesystemService

ProjectScanner

ProjectParser

ProjectStructureBuilder

PatternDetector

DependencyAnalyzer

==================================================
PATTERN DETECTION
==================================================

Implement architecture capable of detecting

- Page Object Model
- Screenplay Pattern
- Hybrid architecture

The detection should be extensible.

==================================================
FILESYSTEM
==================================================

Use Filesystem MCP for all file access.

Do not access the filesystem directly from the analyzer.

==================================================
OUTPUT
==================================================

Return

ProjectStructure

as structured JSON.

==================================================
DOCUMENTATION
==================================================

Generate

README.md

explaining

- module purpose
- architecture
- request flow
- class responsibilities
- future extension points

==================================================
IMPORTANT
==================================================

Build only Phase 1.

Do not implement code generation.

Do not integrate OpenAI.

Do not implement GitHub.

Do not create automation agents yet.

This module exists only to understand the project.
