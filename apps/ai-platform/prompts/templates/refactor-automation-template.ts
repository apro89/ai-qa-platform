/**
 * RefactorAutomationTemplate
 * Template for refactoring existing automation code
 */

import { BasePromptTemplate } from './base-prompt-template.js';
import type { PromptSection, PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export class RefactorAutomationTemplate extends BasePromptTemplate {
  getName(): string {
    return 'RefactorAutomation';
  }

  getVersion(): string {
    return '1.0';
  }

  getSystemPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const refactorGuide = this.createSection(
      'refactor_guide',
      'Refactoring Guidelines',
      `Refactor code to follow Screenplay Pattern.

Refactoring Goals:
1. Extract selectors to Pages
2. Extract workflows to Tasks
3. Extract state checks to Questions
4. Extract browser actions to Interactions
5. Make tests readable as specifications
6. Improve reusability and maintainability

Do NOT:
- Change test behavior
- Add new functionality
- Modify selectors
- Change assertion logic`,
      'critical',
      'instructions',
      true,
    );
    this.addSection(collection, refactorGuide);

    const screenplayRules = this.createSection(
      'screenplay_rules',
      'Screenplay Pattern',
      `Apply Screenplay Pattern:
- Pages: Selectors only
- Tasks: Workflows (compose Interactions)
- Interactions: Atomic actions
- Questions: State retrieval
- Tests: Business behavior only`,
      'high',
      'instructions',
    );
    this.addSection(collection, screenplayRules);

    return collection;
  }

  getUserPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const request = this.createSection(
      'request',
      'Refactoring Request',
      `Refactor this code: ${context.aiRequest.userRequest}

Make it follow Screenplay Pattern and project conventions.`,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, request);

    const output = this.createSection(
      'output',
      'Expected Output',
      `Refactored code that:
1. Extracts selectors to Pages
2. Extracts workflows to Tasks
3. Uses Interactions for actions
4. Uses Questions for assertions
5. Maintains original test logic
6. Improves readability`,
      'high',
      'constraints',
    );
    this.addSection(collection, output);

    return collection;
  }

  getExpectedOutputDescription(): string {
    return 'Refactored code following Screenplay Pattern with separated concerns';
  }

  getConstraints(): string[] {
    return [
      'Do NOT change test behavior',
      'Do NOT modify selectors',
      'Do NOT change assertions',
      'Extract selectors to Pages',
      'Extract workflows to Tasks',
      'Extract actions to Interactions',
      'Extract checks to Questions',
      'Maintain original functionality',
    ];
  }

  getExamples(): Array<{ input: string; output: string; explanation: string }> {
    return [
      {
        input: `test('user login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.click('button[type="submit"]');
  expect(page.url()).toContain('/dashboard');
});`,
        output: `test('@smoke User can log in', async ({ actor, page }) => {
  await actor.attemptsTo(
    Navigate.to(page, LoginPage.url),
    Enter.text(LoginPage.emailInput, 'user@example.com'),
    Click.on(LoginPage.submitButton),
    Verify.that(CurrentUrl.on(page), contains('/dashboard'))
  );
});

// LoginPage.ts
export class LoginPage {
  static url = '/login';
  static emailInput = 'input[name="email"]';
  static submitButton = 'button[type="submit"]';
}`,
        explanation:
          'Extracted selectors to Page, used Interactions and Questions, test reads like specification',
      },
    ];
  }
}
