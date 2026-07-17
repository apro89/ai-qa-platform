/**
 * InstructionBuilder
 *
 * Builds system instructions from project conventions and architecture.
 */

import type { ProjectContext } from '../context/ProjectContext.js';
import type { SystemInstruction } from './AIRequest.js';
import type { Logger } from '../logger/Logger.js';

export class InstructionBuilder {
  constructor(private readonly logger: Logger) {}

  build(projectContext: ProjectContext, templateType: string): SystemInstruction[] {
    const instructions: SystemInstruction[] = [];

    // Architecture instructions
    instructions.push({
      role: 'instruction',
      category: 'architecture',
      priority: 'critical',
      content: this.buildArchitectureInstruction(projectContext),
    });

    // Naming convention instructions
    instructions.push({
      role: 'instruction',
      category: 'convention',
      priority: 'high',
      content: this.buildNamingInstruction(projectContext),
    });

    // Coding style instructions
    instructions.push({
      role: 'instruction',
      category: 'convention',
      priority: 'high',
      content: this.buildStyleInstruction(projectContext),
    });

    // Template-specific instructions
    const templateInstructions = this.getTemplateSpecificInstructions(templateType);
    if (templateInstructions) {
      instructions.push(templateInstructions);
    }

    // Safety instructions
    instructions.push({
      role: 'instruction',
      category: 'safety',
      priority: 'critical',
      content: this.buildSafetyInstruction(),
    });

    this.logger.debug('Built system instructions', { count: instructions.length });
    return instructions;
  }

  private buildArchitectureInstruction(projectContext: ProjectContext): string {
    return `Architecture: ${projectContext.architecture}

The project uses the Screenplay Pattern with these layers:
- Pages: ${projectContext.pages.length} page objects (selectors only)
- Tasks: ${projectContext.tasks.length} tasks (orchestrate business workflows)
- Questions: ${projectContext.questions.length} questions (retrieve state)
- Interactions: ${projectContext.interactions.length} atomic interactions
- Tests: Describe business behavior only, read like specifications

Key rule: NEVER put Playwright actions (page.click, page.fill) directly in tasks or tests.
Always use Interactions for atomic actions.`;
  }

  private buildNamingInstruction(projectContext: ProjectContext): string {
    const { namingConventions } = projectContext;
    const getExamples = (key: string): string => {
      const convention = (namingConventions as unknown as Record<string, unknown>)[
        key
      ] as unknown as Record<string, unknown>;
      const examples = convention?.examples as unknown as string[];
      return examples?.join(', ') || '';
    };

    const examples = {
      pages: getExamples('pages') || 'LoginPage, CartPage, CheckoutPage',
      tasks: getExamples('tasks') || 'LoginTask, CheckoutTask, LogoutTask',
      questions: getExamples('questions') || 'UserIsLoggedIn, OrderConfirmed',
      interactions: getExamples('interactions') || 'Click, Fill, Select',
      tests: getExamples('tests') || 'login.spec.ts, checkout.spec.ts',
    };

    return `Follow these naming conventions:

Pages: ${examples.pages}
Tasks: ${examples.tasks}
Questions: ${examples.questions}
Interactions: ${examples.interactions}
Test files: ${examples.tests}

Always use descriptive names that explain purpose and responsibility.`;
  }

  private buildStyleInstruction(projectContext: ProjectContext): string {
    const style = projectContext.codingStyle;
    const features: string[] = [];
    if (style.asyncAwait) features.push('async/await');
    if (style.typeScriptUsage) features.push('TypeScript with strict types');
    if (style.importStyle === 'absolute')
      features.push('absolute imports with @automation/* alias');

    return `Coding style guide:
- Use: ${features.join(', ')}
- Module syntax: ${style.moduleSyntax}
- Import style: Always use @automation/<layer>/<module>.js
- Never use relative imports like ../../
- Assert with: ${style.assertionLibrary || 'expect() from Playwright'}`;
  }

  private getTemplateSpecificInstructions(templateType: string): SystemInstruction | null {
    const instructions: Record<string, string> = {
      GenerateAutomation: `Generate a complete test scenario with:
1. A Task orchestrating the workflow
2. An Interaction for each atomic action
3. A Question for state verification
4. The test file using these components
Follow the Screenplay Pattern strictly.`,

      GenerateTask: `Create a single Task that:
1. Uses existing Interactions for all Playwright actions
2. Chains multiple Interactions to complete a workflow
3. Includes clear comments explaining the business action
4. Returns data if needed for assertions`,

      GenerateQuestion: `Create a Question that:
1. Retrieves current application state
2. Performs assertions indirectly
3. Never modifies application state
4. Returns boolean or collected data`,

      GenerateInteraction: `Create an Interaction that:
1. Represents ONE atomic action (Click, Fill, Select, etc.)
2. Uses locators from Pages
3. Contains all Playwright implementation details
4. Has a clear, single responsibility`,
    };

    const content = instructions[templateType];
    if (!content) return null;

    return {
      role: 'instruction',
      category: 'convention',
      priority: 'high',
      content,
    };
  }

  private buildSafetyInstruction(): string {
    return `CRITICAL - Always follow these safety rules:
1. Never call page.locator() directly in tests or tasks
2. Never use CSS selectors or XPath in tests
3. All selectors must be in Page objects
4. Tests must describe ONLY business behavior
5. Reuse existing components instead of creating duplicates
6. Check for existing Tasks/Questions before creating new ones
7. Use provided naming conventions exactly
8. Never modify production code or database state
9. All code must be type-safe (TypeScript)
10. Add @smoke or @regression tags to all tests`;
  }
}
