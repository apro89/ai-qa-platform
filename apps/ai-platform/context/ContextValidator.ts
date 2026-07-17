import type { ProjectContext } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('ContextValidator');

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * ContextValidator
 *
 * Validates ProjectContext for:
 * - Completeness
 * - Internal consistency
 * - No duplicates
 * - Reference validity
 */
export class ContextValidator {
  public validate(context: ProjectContext): ValidationResult {
    logger.debug('Starting context validation');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic structure
    if (!context.framework) {
      errors.push('Framework is required');
    }
    if (!context.architecture) {
      errors.push('Architecture is required');
    }

    // Validate artifacts
    errors.push(...this.validateArtifacts(context));
    errors.push(...this.validateNoDuplicates(context));
    errors.push(...this.validateReferences(context));

    // Validate naming conventions
    if (!context.namingConventions.pages) {
      warnings.push('Pages naming convention not detected');
    }
    if (!context.namingConventions.tasks) {
      warnings.push('Tasks naming convention not detected');
    }

    // Validate coding style
    if (!context.codingStyle.assertionLibrary) {
      warnings.push('Assertion library could not be detected');
    }
    if (!context.codingStyle.locatorStyle) {
      warnings.push('Locator style could not be detected');
    }

    // Validate metadata
    if (context.metadata.totalArtifacts === 0) {
      warnings.push('No artifacts found in project');
    }

    const valid = errors.length === 0;
    logger.info('Context validation completed', {
      valid,
      errors: errors.length,
      warnings: warnings.length,
    });

    if (errors.length > 0) {
      logger.warn('Validation errors found', { errors });
    }

    if (warnings.length > 0) {
      logger.warn('Validation warnings', { warnings });
    }

    return { valid, errors, warnings };
  }

  private validateArtifacts(context: ProjectContext): string[] {
    const errors: string[] = [];

    if (!Array.isArray(context.pages)) {
      errors.push('Pages must be an array');
    }
    if (!Array.isArray(context.tasks)) {
      errors.push('Tasks must be an array');
    }
    if (!Array.isArray(context.interactions)) {
      errors.push('Interactions must be an array');
    }
    if (!Array.isArray(context.questions)) {
      errors.push('Questions must be an array');
    }
    if (!Array.isArray(context.components)) {
      errors.push('Components must be an array');
    }
    if (!Array.isArray(context.fixtures)) {
      errors.push('Fixtures must be an array');
    }
    if (!Array.isArray(context.utilities)) {
      errors.push('Utilities must be an array');
    }

    return errors;
  }

  private validateNoDuplicates(context: ProjectContext): string[] {
    const errors: string[] = [];
    const allArtifacts = [
      ...context.pages,
      ...context.tasks,
      ...context.interactions,
      ...context.questions,
      ...context.components,
      ...context.fixtures,
      ...context.utilities,
    ];

    const paths = new Set<string>();
    for (const artifact of allArtifacts) {
      if (paths.has(artifact.path)) {
        errors.push(`Duplicate artifact path: ${artifact.path}`);
      }
      paths.add(artifact.path);
    }

    logger.trace('Duplicate check completed', {
      uniquePaths: paths.size,
      duplicates: errors.length,
    });
    return errors;
  }

  private validateReferences(context: ProjectContext): string[] {
    const errors: string[] = [];

    for (const obj of context.reusableObjects) {
      if (obj.relatedObjects) {
        for (const relatedName of obj.relatedObjects) {
          const exists = context.reusableObjects.some((o) => o.name === relatedName);
          if (!exists) {
            logger.trace('Reference not found', {
              object: obj.name,
              reference: relatedName,
            });
          }
        }
      }
    }

    return errors;
  }
}
