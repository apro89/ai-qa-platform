import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Validates naming conventions according to Screenplay Pattern rules.
 */
export class NamingConventionValidator {
  private readonly fileTypePatterns: Record<string, RegExp> = {
    task: /^[A-Z][a-zA-Z]*Task\.ts$/,
    question: /^[A-Z][a-zA-Z]*Question\.ts$/,
    interaction: /^[A-Z][a-zA-Z]*\.ts$/,
    page: /^[A-Z][a-zA-Z]*Page\.ts$/,
  };

  /**
   * Validate naming conventions for a file.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Extract filename from path
    const pathParts = file.path.split('/');
    const filename = pathParts[pathParts.length - 1];

    // Check file extension
    if (!filename.endsWith('.ts')) {
      violations.push(
        ValidationRuleFactory.createError(
          'NAMING_INVALID_EXTENSION',
          'Invalid File Extension',
          `File "${filename}" must have .ts extension`,
          'naming',
          'Use .ts extension for all TypeScript files',
          file,
        ),
      );
    }

    // Validate filename based on type
    if (file.type === 'task') {
      violations.push(...this.validateTaskName(file, filename));
    } else if (file.type === 'question') {
      violations.push(...this.validateQuestionName(file, filename));
    } else if (file.type === 'page') {
      violations.push(...this.validatePageName(file, filename));
    } else if (file.type === 'interaction') {
      violations.push(...this.validateInteractionName(file, filename));
    }

    // Validate PascalCase naming
    if (filename !== filename[0].toUpperCase() + filename.slice(1)) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'NAMING_NOT_PASCAL_CASE',
          'Naming Convention Mismatch',
          `File "${filename}" should follow PascalCase convention`,
          'naming',
          'Rename to PascalCase (e.g., LoginTask.ts)',
          file,
        ),
      );
    }

    return violations;
  }

  private validateTaskName(file: GeneratedFile, filename: string): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!filename.endsWith('Task.ts')) {
      violations.push(
        ValidationRuleFactory.createError(
          'NAMING_TASK_SUFFIX',
          'Task Naming Convention',
          `Task file "${filename}" must end with "Task.ts" (e.g., LoginTask.ts)`,
          'naming',
          `Rename to follow pattern: *Task.ts`,
          file,
        ),
      );
    }

    // Check if name before "Task" is valid
    const nameBeforeTask = filename.replace('Task.ts', '');
    if (nameBeforeTask.length < 2) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'NAMING_TASK_NAME_TOO_SHORT',
          'Task Name Too Short',
          `Task name "${nameBeforeTask}Task.ts" is too short. Use descriptive names.`,
          'naming',
          'Use more descriptive task names',
          file,
        ),
      );
    }

    return violations;
  }

  private validateQuestionName(file: GeneratedFile, filename: string): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!filename.endsWith('Question.ts')) {
      violations.push(
        ValidationRuleFactory.createError(
          'NAMING_QUESTION_SUFFIX',
          'Question Naming Convention',
          `Question file "${filename}" must end with "Question.ts" (e.g., IsLoginSuccessfulQuestion.ts)`,
          'naming',
          `Rename to follow pattern: *Question.ts`,
          file,
        ),
      );
    }

    const nameBeforeQuestion = filename.replace('Question.ts', '');
    if (nameBeforeQuestion.length < 2) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'NAMING_QUESTION_NAME_TOO_SHORT',
          'Question Name Too Short',
          `Question name "${nameBeforeQuestion}Question.ts" is too short.`,
          'naming',
          'Use more descriptive question names',
          file,
        ),
      );
    }

    return violations;
  }

  private validatePageName(file: GeneratedFile, filename: string): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!filename.endsWith('Page.ts')) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'NAMING_PAGE_SUFFIX',
          'Page Naming Convention',
          `Page file "${filename}" should end with "Page.ts" (e.g., LoginPage.ts)`,
          'naming',
          `Rename to follow pattern: *Page.ts`,
          file,
        ),
      );
    }

    return violations;
  }

  private validateInteractionName(file: GeneratedFile, filename: string): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Interactions should follow PascalCase
    if (!filename[0].match(/[A-Z]/)) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'NAMING_INTERACTION_CASE',
          'Interaction Naming Convention',
          `Interaction "${filename}" should start with uppercase letter`,
          'naming',
          'Use PascalCase for interaction names',
          file,
        ),
      );
    }

    return violations;
  }
}
