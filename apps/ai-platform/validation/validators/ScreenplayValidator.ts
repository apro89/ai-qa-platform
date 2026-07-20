import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Validates Screenplay Pattern compliance.
 */
export class ScreenplayValidator {
  private readonly screenplayPatterns = {
    task: {
      shouldExtend: 'Task',
      shouldHave: ['async perform'],
      shouldNotHave: ['page.click', 'page.fill', 'page.locator'],
    },
    question: {
      shouldExtend: 'Question',
      shouldHave: ['async answeredBy'],
      shouldNotHave: ['click', 'fill', 'locator'],
    },
    interaction: {
      shouldExtend: 'Interaction',
      shouldHave: ['async performAs'],
      shouldNotHave: [],
    },
    page: {
      shouldExtend: 'Page',
      shouldNotHave: ['page.click', 'page.fill', 'page.waitFor', 'async', 'locator()'],
    },
  };

  /**
   * Validate Screenplay pattern compliance.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!file.content) {
      return violations;
    }

    const fileType = file.type as keyof typeof this.screenplayPatterns;

    if (!this.screenplayPatterns[fileType]) {
      return violations;
    }

    const pattern = this.screenplayPatterns[fileType];

    // Check if file extends correct class
    violations.push(...this.validateExtends(file, pattern.shouldExtend));

    // Check for required methods
    violations.push(...this.validateRequiredMethods(file, pattern.shouldHave));

    // Check for forbidden patterns
    violations.push(...this.validateForbiddenPatterns(file, pattern.shouldNotHave));

    // Validate Actor usage in Tasks and Questions
    if (fileType === 'task' || fileType === 'question') {
      violations.push(...this.validateActorUsage(file));
    }

    // Validate proper dependency usage
    violations.push(...this.validateDependencies(file, fileType));

    return violations;
  }

  private validateExtends(file: GeneratedFile, shouldExtend: string): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!file.content.includes(`extends ${shouldExtend}`)) {
      violations.push(
        ValidationRuleFactory.createError(
          'SCREENPLAY_WRONG_BASE_CLASS',
          'Incorrect Base Class',
          `${file.type} should extend "${shouldExtend}" class`,
          'architecture',
          `Add: extends ${shouldExtend}`,
          file,
        ),
      );
    }

    return violations;
  }

  private validateRequiredMethods(file: GeneratedFile, shouldHave: string[]): ValidationRule[] {
    const violations: ValidationRule[] = [];

    for (const method of shouldHave) {
      if (!file.content.includes(method)) {
        violations.push(
          ValidationRuleFactory.createError(
            'SCREENPLAY_MISSING_METHOD',
            'Missing Required Method',
            `${file.type} is missing required method: ${method}`,
            'architecture',
            `Add method: ${method} { ... }`,
            file,
          ),
        );
      }
    }

    return violations;
  }

  private validateForbiddenPatterns(
    file: GeneratedFile,
    shouldNotHave: string[],
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];

    for (const pattern of shouldNotHave) {
      if (file.content.includes(pattern)) {
        violations.push(
          ValidationRuleFactory.createError(
            'SCREENPLAY_FORBIDDEN_PATTERN',
            'Forbidden Pattern in Screenplay',
            `${file.type} contains forbidden pattern: "${pattern}"`,
            'architecture',
            `Encapsulate this in an Interaction instead`,
            file,
            { pattern },
          ),
        );
      }
    }

    return violations;
  }

  private validateActorUsage(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check if actor parameter is used
    if (!file.content.includes('actor') && file.type !== 'page') {
      violations.push(
        ValidationRuleFactory.createWarning(
          'SCREENPLAY_ACTOR_NOT_USED',
          'Actor Parameter Not Used',
          `${file.type} has actor parameter but doesn't seem to use it`,
          'architecture',
          'Ensure actor is used to call abilities or other actors',
          file,
        ),
      );
    }

    return violations;
  }

  private validateDependencies(file: GeneratedFile, fileType: string): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (fileType === 'task') {
      // Tasks should import Interactions and Questions
      if (!file.content.includes('Interaction') && !file.content.includes('Question')) {
        violations.push(
          ValidationRuleFactory.createInfo(
            'SCREENPLAY_NO_DEPENDENCIES',
            'No Screenplay Dependencies',
            'Task does not appear to use Interactions or Questions',
            'architecture',
            'Consider if this Task should orchestrate other Screenplay components',
            file,
          ),
        );
      }
    }

    if (fileType === 'question') {
      // Questions should not have async operations
      if (file.content.includes('page.waitFor')) {
        violations.push(
          ValidationRuleFactory.createWarning(
            'SCREENPLAY_QUESTION_WAIT',
            'Question Contains Wait',
            'Questions should retrieve state, not wait for changes',
            'architecture',
            'Move waits to Tasks or Interactions',
            file,
          ),
        );
      }
    }

    return violations;
  }
}
