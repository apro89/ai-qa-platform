import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from './ValidationRule.js';

/**
 * Result of validating a single file.
 */
export interface ValidationResult {
  /**
   * File being validated.
   */
  file: GeneratedFile;

  /**
   * Whether the file passed validation.
   */
  isValid: boolean;

  /**
   * Validation rules that were violated.
   */
  violations: ValidationRule[];

  /**
   * Quality score for this file (0-100).
   */
  qualityScore: number;

  /**
   * Whether the file is ready to be written to the filesystem.
   */
  readyToWrite: boolean;

  /**
   * Execution time for validation (milliseconds).
   */
  executionTimeMs: number;

  /**
   * Validators that were applied.
   */
  validatorsApplied: string[];

  /**
   * Additional metadata about the validation.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Builder for ValidationResult.
 */
export class ValidationResultBuilder {
  private file: GeneratedFile | null = null;
  private isValid = false;
  private violations: ValidationRule[] = [];
  private qualityScore = 0;
  private readyToWrite = false;
  private executionTimeMs = 0;
  private validatorsApplied: string[] = [];
  private metadata: Record<string, unknown> = {};

  withFile(file: GeneratedFile): this {
    this.file = file;
    return this;
  }

  withIsValid(isValid: boolean): this {
    this.isValid = isValid;
    return this;
  }

  withViolations(violations: ValidationRule[]): this {
    this.violations = violations;
    return this;
  }

  addViolation(violation: ValidationRule): this {
    this.violations.push(violation);
    return this;
  }

  withQualityScore(score: number): this {
    this.qualityScore = Math.max(0, Math.min(100, score));
    return this;
  }

  withReadyToWrite(ready: boolean): this {
    this.readyToWrite = ready;
    return this;
  }

  withExecutionTimeMs(time: number): this {
    this.executionTimeMs = time;
    return this;
  }

  withValidatorsApplied(validators: string[]): this {
    this.validatorsApplied = validators;
    return this;
  }

  addValidatorApplied(validator: string): this {
    if (!this.validatorsApplied.includes(validator)) {
      this.validatorsApplied.push(validator);
    }
    return this;
  }

  withMetadata(metadata: Record<string, unknown>): this {
    this.metadata = metadata;
    return this;
  }

  build(): ValidationResult {
    if (!this.file) {
      throw new Error('File is required for ValidationResult');
    }

    return {
      file: this.file,
      isValid: this.isValid,
      violations: this.violations,
      qualityScore: this.qualityScore,
      readyToWrite: this.readyToWrite,
      executionTimeMs: this.executionTimeMs,
      validatorsApplied: this.validatorsApplied,
      metadata: this.metadata,
    };
  }
}
