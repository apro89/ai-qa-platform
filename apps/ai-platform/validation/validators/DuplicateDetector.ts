import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Detects duplicate objects already existing in the project.
 */
export class DuplicateDetector {
  private existingTasks: Set<string> = new Set();
  private existingQuestions: Set<string> = new Set();
  private existingInteractions: Set<string> = new Set();
  private existingPages: Set<string> = new Set();

  /**
   * Initialize with existing project structure.
   * This would be populated by scanning the project.
   */
  setExistingObjects(
    tasks: string[],
    questions: string[],
    interactions: string[],
    pages: string[],
  ): void {
    this.existingTasks = new Set(tasks);
    this.existingQuestions = new Set(questions);
    this.existingInteractions = new Set(interactions);
    this.existingPages = new Set(pages);
  }

  /**
   * Check for duplicates in a file.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Extract class/interface names from content
    const objectNames = this.extractObjectNames(file.content);

    for (const objectName of objectNames) {
      violations.push(...this.checkObjectDuplicate(objectName, file));
    }

    // Check file path duplicates
    violations.push(...this.checkPathDuplicate(file));

    return violations;
  }

  private extractObjectNames(content: string): string[] {
    const names: string[] = [];

    // Extract class names
    const classMatches = content.matchAll(/export\s+class\s+(\w+)/g);
    for (const match of classMatches) {
      names.push(match[1]);
    }

    // Extract interface names
    const interfaceMatches = content.matchAll(/export\s+interface\s+(\w+)/g);
    for (const match of interfaceMatches) {
      names.push(match[1]);
    }

    return names;
  }

  private checkObjectDuplicate(objectName: string, file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (objectName.endsWith('Task')) {
      if (this.existingTasks.has(objectName)) {
        violations.push(
          ValidationRuleFactory.createError(
            'DUPLICATE_TASK',
            'Duplicate Task Detected',
            `Task "${objectName}" already exists in the project`,
            'duplicates',
            'Choose a different name or update the existing task',
            file,
            { existingObject: objectName, type: 'task' },
          ),
        );
      }
    } else if (objectName.endsWith('Question')) {
      if (this.existingQuestions.has(objectName)) {
        violations.push(
          ValidationRuleFactory.createError(
            'DUPLICATE_QUESTION',
            'Duplicate Question Detected',
            `Question "${objectName}" already exists in the project`,
            'duplicates',
            'Choose a different name or update the existing question',
            file,
            { existingObject: objectName, type: 'question' },
          ),
        );
      }
    } else if (objectName.endsWith('Page')) {
      if (this.existingPages.has(objectName)) {
        violations.push(
          ValidationRuleFactory.createError(
            'DUPLICATE_PAGE',
            'Duplicate Page Detected',
            `Page "${objectName}" already exists in the project`,
            'duplicates',
            'Choose a different name or update the existing page',
            file,
            { existingObject: objectName, type: 'page' },
          ),
        );
      }
    } else if (this.existingInteractions.has(objectName)) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'DUPLICATE_INTERACTION',
          'Duplicate Interaction Detected',
          `Interaction "${objectName}" might already exist in the project`,
          'duplicates',
          'Verify if this interaction already exists',
          file,
          { existingObject: objectName, type: 'interaction' },
        ),
      );
    }

    return violations;
  }

  private checkPathDuplicate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check all existing types' paths
    const allExisting = [
      ...Array.from(this.existingTasks),
      ...Array.from(this.existingQuestions),
      ...Array.from(this.existingPages),
      ...Array.from(this.existingInteractions),
    ];

    // This is a simple check - in reality you'd check against actual file paths
    // For now we check if the same type/name combination exists
    if (
      (file.type === 'task' && this.existingTasks.has(this.getObjectName(file))) ||
      (file.type === 'question' && this.existingQuestions.has(this.getObjectName(file))) ||
      (file.type === 'page' && this.existingPages.has(this.getObjectName(file))) ||
      (file.type === 'interaction' && this.existingInteractions.has(this.getObjectName(file)))
    ) {
      violations.push(
        ValidationRuleFactory.createError(
          'DUPLICATE_FILE',
          'Duplicate File Path',
          `File at path "${file.path}" conflicts with existing file`,
          'duplicates',
          'Use a different file path or name',
          file,
          { path: file.path },
        ),
      );
    }

    return violations;
  }

  private getObjectName(file: GeneratedFile): string {
    const names = this.extractObjectNames(file.content);
    return names[0] || file.path;
  }
}
