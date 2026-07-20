import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from './ValidationRule.js';

/**
 * Represents a generation after passing through the validation engine.
 * This is the output from Phase 7.
 */
export interface ValidatedGeneration {
  /**
   * Files that passed all validation checks.
   */
  approvedFiles: GeneratedFile[];

  /**
   * Files that failed validation and cannot be written.
   */
  rejectedFiles: GeneratedFile[];

  /**
   * Overall validation status.
   */
  isValid: boolean;

  /**
   * Overall quality score (0-100).
   */
  qualityScore: number;

  /**
   * Whether generation is ready to write to filesystem.
   */
  readyToWrite: boolean;

  /**
   * All validation violations (errors and warnings).
   */
  violations: ValidationRule[];

  /**
   * Non-blocking warnings for approved files.
   */
  warnings: ValidationRule[];

  /**
   * Critical errors that blocked approval.
   */
  errors: ValidationRule[];

  /**
   * Detailed validation report.
   */
  report: ValidationReport;

  /**
   * Total execution time (milliseconds).
   */
  executionTimeMs: number;

  /**
   * Metadata about the validation process.
   */
  metadata: {
    totalFilesValidated: number;
    approvedCount: number;
    rejectedCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    validators: string[];
    [key: string]: unknown;
  };
}

/**
 * Detailed report of the validation process.
 */
export interface ValidationReport {
  /**
   * Human-readable summary of validation results.
   */
  summary: string;

  /**
   * Grouped violations by category.
   */
  byCategory: Record<string, ValidationRule[]>;

  /**
   * Grouped violations by severity.
   */
  bySeverity: Record<string, ValidationRule[]>;

  /**
   * Grouped violations by file.
   */
  byFile: Record<string, ValidationRule[]>;

  /**
   * Score breakdown by category.
   */
  scoreBreakdown: Record<string, number>;

  /**
   * Recommendations for fixing issues.
   */
  recommendations: string[];
}

/**
 * Builder for ValidatedGeneration.
 */
export class ValidatedGenerationBuilder {
  private approvedFiles: GeneratedFile[] = [];
  private rejectedFiles: GeneratedFile[] = [];
  private isValid = false;
  private qualityScore = 0;
  private readyToWrite = false;
  private violations: ValidationRule[] = [];
  private warnings: ValidationRule[] = [];
  private errors: ValidationRule[] = [];
  private report: ValidationReport = {
    summary: '',
    byCategory: {},
    bySeverity: {},
    byFile: {},
    scoreBreakdown: {},
    recommendations: [],
  };
  private executionTimeMs = 0;
  private metadata: ValidatedGeneration['metadata'] = {
    totalFilesValidated: 0,
    approvedCount: 0,
    rejectedCount: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    validators: [],
  };

  withApprovedFiles(files: GeneratedFile[]): this {
    this.approvedFiles = files;
    this.metadata.approvedCount = files.length;
    return this;
  }

  addApprovedFile(file: GeneratedFile): this {
    this.approvedFiles.push(file);
    this.metadata.approvedCount = this.approvedFiles.length;
    return this;
  }

  withRejectedFiles(files: GeneratedFile[]): this {
    this.rejectedFiles = files;
    this.metadata.rejectedCount = files.length;
    return this;
  }

  addRejectedFile(file: GeneratedFile): this {
    this.rejectedFiles.push(file);
    this.metadata.rejectedCount = this.rejectedFiles.length;
    return this;
  }

  withIsValid(isValid: boolean): this {
    this.isValid = isValid;
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

  withViolations(violations: ValidationRule[]): this {
    this.violations = violations;
    this.updateViolationCounts();
    return this;
  }

  addViolation(violation: ValidationRule): this {
    this.violations.push(violation);
    if (violation.severity === 'error') {
      this.errors.push(violation);
      this.metadata.errorCount++;
    } else if (violation.severity === 'warning') {
      this.warnings.push(violation);
      this.metadata.warningCount++;
    } else {
      this.metadata.infoCount++;
    }
    return this;
  }

  withExecutionTimeMs(time: number): this {
    this.executionTimeMs = time;
    return this;
  }

  withReport(report: ValidationReport): this {
    this.report = report;
    return this;
  }

  withValidators(validators: string[]): this {
    this.metadata.validators = validators;
    return this;
  }

  withTotalFilesValidated(count: number): this {
    this.metadata.totalFilesValidated = count;
    return this;
  }

  build(): ValidatedGeneration {
    return {
      approvedFiles: this.approvedFiles,
      rejectedFiles: this.rejectedFiles,
      isValid: this.isValid,
      qualityScore: this.qualityScore,
      readyToWrite: this.readyToWrite,
      violations: this.violations,
      warnings: this.warnings,
      errors: this.errors,
      report: this.report,
      executionTimeMs: this.executionTimeMs,
      metadata: this.metadata,
    };
  }

  private updateViolationCounts(): void {
    this.metadata.errorCount = 0;
    this.metadata.warningCount = 0;
    this.metadata.infoCount = 0;
    this.errors = [];
    this.warnings = [];

    for (const violation of this.violations) {
      if (violation.severity === 'error') {
        this.errors.push(violation);
        this.metadata.errorCount++;
      } else if (violation.severity === 'warning') {
        this.warnings.push(violation);
        this.metadata.warningCount++;
      } else {
        this.metadata.infoCount++;
      }
    }
  }
}
