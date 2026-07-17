/**
 * GenerateAutomationTemplate
 *
 * Template for generating complete Playwright automation tests.
 * Focuses on end-to-end test scenarios.
 */

import { BasePromptTemplate } from './base-prompt-template.js';
import type { PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export class GenerateAutomationTemplate extends BasePromptTemplate {
  getName(): string {
    return 'GenerateAutomation';
  }

  getVersion(): string {
    return '1.0';
  }

  getSystemPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    // Architecture Instructions
    const architecture = this.createSection(
      'arch_overview',
      'Project Architecture',
      `Your task is to generate Playwright automation tests using the Screenplay Pattern.

The project uses:
- Framework: ${context.aiRequest.projectContext.framework || 'Playwright'}
- Architecture: ${context.aiRequest.projectContext.architecture || 'Screenplay Pattern'}

Key concepts:
- Actors: Users performing actions
- Abilities: What actors can do
- Tasks: Reusable workflows
- Interactions: Atomic actions (Click, FillField, etc.)
- Questions: Retrieve application state
- Pages: Selectors and page structure`,
      'critical',
      'instructions',
      true,
    );
    this.addSection(collection, architecture);

    // Naming Conventions
    if (context.includeNamingConventions) {
      const naming = this.createSection(
        'naming_conventions',
        'Naming Conventions',
        this.buildNamingConventionsContent(context),
        'high',
        'instructions',
        true,
      );
      this.addSection(collection, naming);
    }

    // Coding Style
    if (context.includeCodingStyle) {
      const style = this.createSection(
        'coding_style',
        'Code Style Guidelines',
        this.buildCodingStyleContent(context),
        'high',
        'instructions',
        true,
      );
      this.addSection(collection, style);
    }

    // Screenplay Pattern Rules
    const screenplayRules = this.createSection(
      'screenplay_rules',
      'Screenplay Pattern Rules',
      `Follow these rules when generating tests:

1. Tests describe ONLY business behavior
2. No page.locator() or page.click() directly in tests
3. All low-level actions through Interactions
4. All assertions through Questions
5. Tests should read like business specifications

Example structure:
\`\`\`typescript
test('@smoke User can log in', async ({ actor }) => {
  await actor.attemptsTo(
    Navigate.to(LoginPage.url),
    Enter.text(LoginPage.emailInput, 'user@example.com'),
    Click.on(LoginPage.submitButton),
    Verify.that(IsLoggedIn.on(page), equals(true))
  );
});
\`\`\``,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, screenplayRules);

    // Import Conventions
    const imports = this.createSection(
      'import_conventions',
      'Import Conventions',
      `Use @automation/* aliases for all internal imports.

Examples:
\`\`\`typescript
import { LoginPage } from '@automation/pages/LoginPage.js';
import { LoginTask } from '@automation/tasks/LoginTask.js';
import { IsLoggedIn } from '@automation/questions/IsLoggedIn.js';
import { Navigate } from '@automation/interactions/Navigate.js';
\`\`\`

Always use .js extension for ESM compatibility.`,
      'high',
      'requirements',
      true,
    );
    this.addSection(collection, imports);

    return collection;
  }

  getUserPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    // User Request
    const request = this.createSection(
      'user_request',
      'Test Requirement',
      `Generate Playwright automation: ${context.aiRequest.userRequest}

Template type: ${context.aiRequest.templateType}
Framework: ${context.aiRequest.projectContext.framework}`,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, request);

    // Available Components
    if (context.includeReusablePatterns) {
      const patterns = this.createSection(
        'available_patterns',
        'Available Components',
        this.buildAvailablePatternsContent(context),
        'high',
        'context',
      );
      this.addSection(collection, patterns);
    }

    // Project Context
    const projectContext = this.createSection(
      'project_context',
      'Project Structure',
      this.buildProjectContextContent(context),
      'high',
      'context',
    );
    this.addSection(collection, projectContext);

    // Expected Output Format
    const expectedOutput = this.createSection(
      'expected_output',
      'Expected Output Format',
      this.getExpectedOutputDescription(),
      'high',
      'constraints',
    );
    this.addSection(collection, expectedOutput);

    // Examples
    if (context.includeExamples) {
      const examples = this.createSection(
        'examples',
        'Example Tests',
        this.buildExamplesContent(),
        'normal',
        'examples',
      );
      this.addSection(collection, examples);
    }

    // Constraints
    const constraints = this.createSection(
      'constraints',
      'Constraints',
      this.buildConstraintsContent(),
      'high',
      'constraints',
    );
    this.addSection(collection, constraints);

    return collection;
  }

  getExpectedOutputDescription(): string {
    return `Generate a TypeScript test file (.spec.ts) that:
1. Imports required Pages, Tasks, Questions, Interactions
2. Defines one or more test cases using @smoke or @regression tags
3. Uses Actor pattern to describe user actions
4. Tests complete business workflows
5. Includes assertions via Questions
6. Follows naming: describe block and test names are descriptive`;
  }

  getConstraints(): string[] {
    return [
      'Do NOT use page.locator() or page.click() directly in tests',
      'Do NOT use CSS selectors in test code',
      'Do NOT use XPath in test code',
      'All business logic must be in Tasks or Interactions',
      'Tests must be readable as specifications',
      'Include at least one @smoke and one @regression tag',
      'Page selectors stay only in Pages',
      'Use proper error handling',
      'Include meaningful assertion messages',
    ];
  }

  getExamples(): Array<{ input: string; output: string; explanation: string }> {
    return [
      {
        input: 'Create a test for user login with email validation',
        output: `test('@smoke User can log in with valid email', async ({ actor, page }) => {
  await actor.attemptsTo(
    Navigate.to(page, '/login'),
    Enter.text(LoginPage.emailInput, 'user@example.com'),
    Enter.text(LoginPage.passwordInput, 'password123'),
    Click.on(LoginPage.submitButton),
    Verify.that(IsLoggedIn.on(page), equals(true))
  );
});`,
        explanation:
          'Test uses Actor with Tasks, Interactions, and Questions. No direct page manipulation.',
      },
    ];
  }

  private buildNamingConventionsContent(context: PromptContext): string {
    const naming = context.aiRequest.projectContext.namingConventions;
    if (!naming) {
      return 'Follow PascalCase for classes and camelCase for variables.';
    }

    const lines: string[] = ['Follow these naming conventions:'];

    if (naming.pageObjectPattern) {
      lines.push(`- Pages: ${naming.pageObjectPattern}`);
    }
    if (naming.taskPattern) {
      lines.push(`- Tasks: ${naming.taskPattern}`);
    }
    if (naming.questionPattern) {
      lines.push(`- Questions: ${naming.questionPattern}`);
    }
    if (naming.interactionPattern) {
      lines.push(`- Interactions: ${naming.interactionPattern}`);
    }

    return lines.join('\n');
  }

  private buildCodingStyleContent(context: PromptContext): string {
    const style = context.aiRequest.projectContext.codingStyle;
    if (!style) {
      return 'Use async/await, TypeScript strict mode, and descriptive variable names.';
    }

    const lines: string[] = ['Code style rules:'];

    if (style.asyncAwaitPreferred !== undefined) {
      lines.push(`- Use ${style.asyncAwaitPreferred ? 'async/await' : 'promises'}`);
    }
    if (style.strictMode !== undefined) {
      lines.push(`- TypeScript: ${style.strictMode ? 'strict mode' : 'standard mode'}`);
    }

    return lines.join('\n');
  }

  private buildAvailablePatternsContent(context: PromptContext): string {
    const patterns = context.aiRequest.reusablePatterns;
    if (!patterns) {
      return 'Reusable patterns: Check project structure for available components.';
    }

    const lines: string[] = ['Available reusable components:'];

    if (patterns.pages && patterns.pages.length > 0) {
      lines.push(`\nPages (${patterns.pages.length}):`);
      patterns.pages.slice(0, 5).forEach((p) => {
        lines.push(`  - ${p.name}`);
      });
      if (patterns.pages.length > 5) {
        lines.push(`  ... and ${patterns.pages.length - 5} more`);
      }
    }

    if (patterns.tasks && patterns.tasks.length > 0) {
      lines.push(`\nTasks (${patterns.tasks.length}):`);
      patterns.tasks.slice(0, 5).forEach((t) => {
        lines.push(`  - ${t.name}`);
      });
      if (patterns.tasks.length > 5) {
        lines.push(`  ... and ${patterns.tasks.length - 5} more`);
      }
    }

    return lines.join('\n');
  }

  private buildProjectContextContent(context: PromptContext): string {
    const ctx = context.aiRequest.projectContext;
    const lines: string[] = [`Framework: ${ctx.framework}`, `Architecture: ${ctx.architecture}`];
    return lines.join('\n');
  }

  private buildExamplesContent(): string {
    return `Example test structure:
\`\`\`typescript
import { test } from '@playwright/test';
import { Actor } from '@automation/actors/actor.js';
import { LoginPage } from '@automation/pages/LoginPage.js';

test('@smoke User can log in', async ({ page }) => {
  const actor = new Actor(page);
  
  await actor.attemptsTo(
    Navigate.to(page, '/login'),
    Enter.text(LoginPage.emailInput, 'user@example.com'),
    Click.on(LoginPage.submitButton)
  );
});
\`\`\``;
  }

  private buildConstraintsContent(): string {
    return this.getConstraints()
      .map((c) => `• ${c}`)
      .join('\n');
  }
}
