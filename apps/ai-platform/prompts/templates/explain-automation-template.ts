/**
 * ExplainAutomationTemplate
 * Template for explaining/documenting automation code
 */

import { BasePromptTemplate } from './base-prompt-template.js';
import type { PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export class ExplainAutomationTemplate extends BasePromptTemplate {
  getName(): string {
    return 'ExplainAutomation';
  }

  getVersion(): string {
    return '1.0';
  }

  getSystemPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const explainGuide = this.createSection(
      'explain_guide',
      'Explanation Guidelines',
      `Explain Playwright/Screenplay Pattern code clearly.

Explanation should include:
1. What the code does (business perspective)
2. How it works (technical perspective)
3. Why it's structured this way (pattern perspective)
4. Key components and their roles
5. Dependencies and relationships
6. Testing strategy

Make it understandable for:
- QA engineers (behavior)
- Developers (implementation)
- Team leads (architecture)`,
      'critical',
      'instructions',
      true,
    );
    this.addSection(collection, explainGuide);

    const screenplayRules = this.createSection(
      'screenplay_concepts',
      'Screenplay Pattern Concepts',
      `Key patterns:
- Actor: User/system performing actions
- Ability: What actor can do (Browse the web)
- Task: Business workflow
- Interaction: Atomic browser action
- Question: State retrieval
- Page: Selector collection`,
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
      'Explanation Request',
      `Explain this code: ${context.aiRequest.userRequest}

Provide clear, comprehensive explanation suitable for team documentation.`,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, request);

    const output = this.createSection(
      'output',
      'Expected Output Format',
      `Explanation should include:
1. Executive summary (one paragraph)
2. Code breakdown (section by section)
3. Key design patterns used
4. Dependencies and interactions
5. Test strategy and coverage
6. Common pitfalls/improvements`,
      'high',
      'constraints',
    );
    this.addSection(collection, output);

    return collection;
  }

  getExpectedOutputDescription(): string {
    return 'Clear, structured explanation of test/automation code with business and technical perspectives';
  }

  getConstraints(): string[] {
    return [
      'Explain business behavior first',
      'Then explain technical implementation',
      'Include pattern concepts used',
      'Describe dependencies clearly',
      'Provide context for design decisions',
      'Include testing strategy',
      'Suitable for documentation',
      'Use clear, non-technical language where possible',
    ];
  }

  getExamples(): Array<{ input: string; output: string; explanation: string }> {
    return [
      {
        input: `test('@smoke User can log in', async ({ actor, page }) => {
  await actor.attemptsTo(
    Navigate.to(page, LoginPage.url),
    Enter.text(LoginPage.emailInput, 'user@example.com'),
    Click.on(LoginPage.submitButton),
    Verify.that(IsLoggedIn.on(page), equals(true))
  );
});`,
        output: `## Login Test Explanation

### Business Behavior
This test verifies that a user can successfully log in with valid credentials. It navigates to the login page, enters email, submits the form, and confirms successful login.

### Technical Implementation
The test uses Screenplay Pattern:
- **Actor**: Represents the user performing actions
- **Interactions**: 
  - Navigate: Loads the login page
  - Enter: Fills email field
  - Click: Submits the form
- **Question**: IsLoggedIn checks if user is authenticated
- **Assertion**: Verifies login was successful

### Design Pattern
Uses Screenplay to separate concerns:
- Test describes WHAT (business requirement)
- Interactions describe HOW (browser actions)
- Page describes WHERE (selectors)

This makes tests maintainable and readable.`,
        explanation:
          'Explanation covers business perspective, technical implementation, and design reasoning',
      },
    ];
  }
}
