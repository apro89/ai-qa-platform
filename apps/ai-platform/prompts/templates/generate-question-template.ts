/**
 * GenerateQuestionTemplate
 * Template for generating Question classes
 */

import { BasePromptTemplate } from './base-prompt-template.js';
import type { PromptSection, PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export class GenerateQuestionTemplate extends BasePromptTemplate {
  getName(): string {
    return 'GenerateQuestion';
  }

  getVersion(): string {
    return '1.0';
  }

  getSystemPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const questionPattern = this.createSection(
      'question_pattern',
      'Question Pattern',
      `Questions retrieve application state and enable assertions.

Question Structure:
\`\`\`typescript
export class ${context.aiRequest.userRequest || 'ExampleQuestion'} extends Question<T> {
  static about(subject: unknown): ${context.aiRequest.userRequest || 'ExampleQuestion'} {
    return new ${context.aiRequest.userRequest || 'ExampleQuestion'}(subject);
  }

  async answeredBy(actor: Actor): Promise<T> {
    // Retrieve and return state
  }

  toString(): string {
    return \`The ...\`;
  }
}
\`\`\`

Rules:
- Questions are named with Question suffix
- Never modify application state
- Return data that Verify can assert on
- Use generic T for return type`,
      'critical',
      'instructions',
      true,
    );
    this.addSection(collection, questionPattern);

    return collection;
  }

  getUserPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const request = this.createSection(
      'request',
      'Question Requirement',
      `Generate a Question: ${context.aiRequest.userRequest}`,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, request);

    const output = this.createSection(
      'output',
      'Expected Output',
      `Export a generic Question<T> class that:
1. Has static about(subject) factory
2. Implements answeredBy(actor) async method
3. Returns typed data (not just true/false)
4. Includes toString() for logging`,
      'high',
      'constraints',
    );
    this.addSection(collection, output);

    return collection;
  }

  getExpectedOutputDescription(): string {
    return 'TypeScript generic Question<T> class for retrieving application state';
  }

  getConstraints(): string[] {
    return [
      'Must extend Question<T> with proper generic type',
      'Must be read-only (no state modifications)',
      'Must have static about(subject) method',
      'Must implement answeredBy(actor) method',
      'Must implement toString() method',
      'Return value suitable for assertions',
    ];
  }

  getExamples(): Array<{ input: string; output: string; explanation: string }> {
    return [
      {
        input: 'Create a Question that checks if user is logged in',
        output: `export class IsLoggedIn extends Question<boolean> {
  private constructor(private page: Page) {
    super();
  }

  static on(page: Page): IsLoggedIn {
    return new IsLoggedIn(page);
  }

  async answeredBy(actor: Actor): Promise<boolean> {
    const url = this.page.url();
    return !url.includes('/login');
  }

  toString(): string {
    return 'User is logged in';
  }
}`,
        explanation: 'Question checks state without modifying it, returns boolean for assertion',
      },
    ];
  }
}
