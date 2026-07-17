/**
 * GenerateTaskTemplate
 * Template for generating Task classes
 */

import { BasePromptTemplate } from './base-prompt-template.js';
import type { PromptSection, PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export class GenerateTaskTemplate extends BasePromptTemplate {
  getName(): string {
    return 'GenerateTask';
  }

  getVersion(): string {
    return '1.0';
  }

  getSystemPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const taskPattern = this.createSection(
      'task_pattern',
      'Task Pattern',
      `Tasks represent complete business workflows composed of Interactions and Questions.

Task Structure:
\`\`\`typescript
export class ${context.aiRequest.userRequest || 'ExampleTask'} extends Task {
  static of(actor: Actor): ${context.aiRequest.userRequest || 'ExampleTask'} {
    return actor.attemptsTo(new ${context.aiRequest.userRequest || 'ExampleTask'}());
  }

  async performAs(actor: Actor): Promise<void> {
    // Orchestrate Interactions and Questions
  }
}
\`\`\`

Rules:
- Tasks are named with Task suffix
- Orchestrate Interactions and Questions only
- Handle errors gracefully
- Log important state changes`,
      'critical',
      'instructions',
      true,
    );
    this.addSection(collection, taskPattern);

    const codeStyle = this.createSection(
      'code_style',
      'Code Style',
      `Follow project conventions:
- Use async/await
- TypeScript strict mode
- Descriptive method names
- JSDoc comments for public methods`,
      'high',
      'instructions',
    );
    this.addSection(collection, codeStyle);

    return collection;
  }

  getUserPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const request = this.createSection(
      'request',
      'Task Requirement',
      `Generate a Task: ${context.aiRequest.userRequest}`,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, request);

    const output = this.createSection(
      'output',
      'Expected Output',
      `Export a class extending Task with:
1. static of(actor: Actor) method
2. async performAs(actor: Actor) method
3. Proper error handling
4. JSDoc comments`,
      'high',
      'constraints',
    );
    this.addSection(collection, output);

    return collection;
  }

  getExpectedOutputDescription(): string {
    return 'TypeScript class extending Task with static factory method and performAs implementation';
  }

  getConstraints(): string[] {
    return [
      'Must extend Task base class',
      'Must have static of(actor) factory method',
      'Must implement performAs(actor) method',
      'Use Interactions and Questions, not page methods',
      'Include error handling',
      'Include JSDoc comments',
    ];
  }

  getExamples(): Array<{ input: string; output: string; explanation: string }> {
    return [
      {
        input: 'Create a LoginTask that fills email, password and clicks submit',
        output: `export class LoginTask extends Task {
  constructor(private email: string, private password: string) {
    super();
  }

  static with(email: string, password: string): LoginTask {
    return new LoginTask(email, password);
  }

  async performAs(actor: Actor): Promise<void> {
    await actor.attemptsTo(
      Navigate.to(LoginPage.url),
      Enter.text(LoginPage.emailInput, this.email),
      Enter.text(LoginPage.passwordInput, this.password),
      Click.on(LoginPage.submitButton)
    );
  }
}`,
        explanation: 'Task composes Interactions with constructor parameters for flexibility',
      },
    ];
  }
}
