/**
 * GenerateInteractionTemplate
 * Template for generating Interaction classes
 */

import { BasePromptTemplate } from './base-prompt-template.js';
import type { PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export class GenerateInteractionTemplate extends BasePromptTemplate {
  getName(): string {
    return 'GenerateInteraction';
  }

  getVersion(): string {
    return '1.0';
  }

  getSystemPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const interactionPattern = this.createSection(
      'interaction_pattern',
      'Interaction Pattern',
      `Interactions represent atomic, reusable browser actions.

Interaction Structure:
\`\`\`typescript
export class ${context.aiRequest.userRequest || 'ExampleInteraction'} extends Interaction {
  constructor(private target: string | Locator, private data?: unknown) {
    super();
  }

  static on(target: string | Locator): ${context.aiRequest.userRequest || 'ExampleInteraction'} {
    return new ${context.aiRequest.userRequest || 'ExampleInteraction'}(target);
  }

  async performAs(actor: Actor): Promise<void> {
    // Single atomic action
  }

  toString(): string {
    return \`...\`;
  }
}
\`\`\`

Rules:
- ONE responsibility per Interaction
- Reusable across multiple Tasks
- Use Playwright directly
- Include error handling
- Provide meaningful toString()`,
      'critical',
      'instructions',
      true,
    );
    this.addSection(collection, interactionPattern);

    return collection;
  }

  getUserPromptSections(context: PromptContext): PromptSectionCollection {
    const collection = this.createSectionCollection();

    const request = this.createSection(
      'request',
      'Interaction Requirement',
      `Generate an Interaction: ${context.aiRequest.userRequest}`,
      'critical',
      'requirements',
      true,
    );
    this.addSection(collection, request);

    const output = this.createSection(
      'output',
      'Expected Output',
      `Export an Interaction class that:
1. Extends Interaction base class
2. Has static factory method
3. Implements performAs(actor) method
4. Performs ONE atomic action
5. Includes error handling
6. Implements toString()`,
      'high',
      'constraints',
    );
    this.addSection(collection, output);

    return collection;
  }

  getExpectedOutputDescription(): string {
    return 'TypeScript Interaction class for a single atomic browser action';
  }

  getConstraints(): string[] {
    return [
      'Must extend Interaction base class',
      'Must have static factory method (e.g., on, with)',
      'Must implement performAs(actor) method',
      'ONE atomic action only (not workflows)',
      'Use Playwright directly in performAs',
      'Include error handling',
      'Implement toString() for logging',
      'Constructor should accept target/data parameters',
    ];
  }

  getExamples(): Array<{ input: string; output: string; explanation: string }> {
    return [
      {
        input: 'Create a Click Interaction that clicks on a locator',
        output: `export class Click extends Interaction {
  constructor(private target: Locator) {
    super();
  }

  static on(target: Locator): Click {
    return new Click(target);
  }

  async performAs(actor: Actor): Promise<void> {
    await this.target.click();
  }

  toString(): string {
    return \`Click on element\`;
  }
}`,
        explanation: 'Interaction wraps single Playwright action with reusable pattern',
      },
    ];
  }
}
