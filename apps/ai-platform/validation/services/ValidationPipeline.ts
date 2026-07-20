import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationResult } from '../models/ValidationResult.js';
import { ValidationResultBuilder } from '../models/ValidationResult.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationSeverity } from '../models/ValidationSeverity.js';
import { ValidationPipelineError } from '../errors/ValidationEngineError.js';
import { NamingConventionValidator } from '../validators/NamingConventionValidator.js';
import { ImportValidator } from '../validators/ImportValidator.js';
import { ScreenplayValidator } from '../validators/ScreenplayValidator.js';
import { FilePathValidator } from '../validators/FilePathValidator.js';
import { TypeScriptValidator } from '../validators/TypeScriptValidator.js';
import { CodeQualityValidator } from '../validators/CodeQualityValidator.js';

/**
 * Validator interface for duck typing.
 */
interface Validator {
  validate(file: GeneratedFile): ValidationRule[];
}

/**
 * Executes validators sequentially in a pipeline pattern.
 * Each validator is independent and can be reordered.
 */
export class ValidationPipeline {
  private validators: Map<string, Validator> = new Map();
  private validatorOrder: string[] = [];

  constructor() {
    this.registerDefaultValidators();
  }

  /**
   * Register default validators.
   */
  private registerDefaultValidators(): void {
    this.register('FilePathValidator', new FilePathValidator());
    this.register('NamingConventionValidator', new NamingConventionValidator());
    this.register('ImportValidator', new ImportValidator());
    this.register('ScreenplayValidator', new ScreenplayValidator());
    this.register('TypeScriptValidator', new TypeScriptValidator());
    this.register('CodeQualityValidator', new CodeQualityValidator());
  }

  /**
   * Register a custom validator.
   */
  register(name: string, validator: Validator): void {
    this.validators.set(name, validator);
    if (!this.validatorOrder.includes(name)) {
      this.validatorOrder.push(name);
    }
  }

  /**
   * Unregister a validator.
   */
  unregister(name: string): void {
    this.validators.delete(name);
    this.validatorOrder = this.validatorOrder.filter((n) => n !== name);
  }

  /**
   * Set the order in which validators are executed.
   */
  setOrder(order: string[]): void {
    // Validate all validators in order exist
    for (const name of order) {
      if (!this.validators.has(name)) {
        throw new ValidationPipelineError(
          `Validator "${name}" not registered`,
          'UNKNOWN_VALIDATOR',
          { validatorName: name },
        );
      }
    }
    this.validatorOrder = order;
  }

  /**
   * Execute all validators on a file.
   */
  async validate(file: GeneratedFile): Promise<ValidationResult> {
    const startTime = Date.now();
    const violations: ValidationRule[] = [];
    const appliedValidators: string[] = [];

    try {
      for (const validatorName of this.validatorOrder) {
        const validator = this.validators.get(validatorName);
        if (!validator) {
          continue;
        }

        try {
          const validatorViolations = validator.validate(file);
          violations.push(...validatorViolations);
          appliedValidators.push(validatorName);
        } catch (error) {
          // Log validator error but continue with others
          console.error(`Validator ${validatorName} failed:`, error);
        }
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(violations);

      // Determine if file is valid (only errors block it)
      const hasErrors = violations.some((v) => v.severity === ValidationSeverity.ERROR);
      const isValid = !hasErrors;

      const executionTimeMs = Date.now() - startTime;

      return new ValidationResultBuilder()
        .withFile(file)
        .withIsValid(isValid)
        .withViolations(violations)
        .withQualityScore(qualityScore)
        .withReadyToWrite(isValid)
        .withExecutionTimeMs(executionTimeMs)
        .withValidatorsApplied(appliedValidators)
        .build();
    } catch (error) {
      throw new ValidationPipelineError(
        `Validation pipeline failed for file "${file.path}": ${error}`,
        'PIPELINE_EXECUTION_FAILED',
        { file: file.path, error },
      );
    }
  }

  /**
   * Get list of registered validators.
   */
  getValidators(): string[] {
    return [...this.validatorOrder];
  }

  /**
   * Calculate quality score based on violations.
   */
  private calculateQualityScore(violations: ValidationRule[]): number {
    if (violations.length === 0) {
      return 100;
    }

    // Score degradation per violation type
    let score = 100;

    for (const violation of violations) {
      if (violation.severity === ValidationSeverity.ERROR) {
        score -= 15; // Errors degrade score more
      } else if (violation.severity === ValidationSeverity.WARNING) {
        score -= 5;
      } else {
        score -= 1; // Info messages
      }
    }

    return Math.max(0, score);
  }
}
