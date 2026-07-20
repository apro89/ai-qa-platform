import type { GeneratedFile } from './GeneratedFile.js';

/**
 * Represents the complete result of processing an AIResponse.
 * This is the output from the AI Response Processing Engine.
 */
export interface GenerationResult {
  /**
   * Whether processing succeeded (even if there are warnings).
   */
  success: boolean;

  /**
   * Array of generated files extracted from the response.
   */
  generatedFiles: GeneratedFile[];

  /**
   * Non-critical issues during processing.
   * Processing may still succeed with warnings present.
   */
  warnings: string[];

  /**
   * Critical errors that prevented successful processing.
   * If errors array is non-empty, success should be false.
   */
  errors: string[];

  /**
   * Metadata about the processing operation.
   */
  metadata: {
    /**
     * Time taken to process the response (milliseconds).
     */
    processingTimeMs: number;

    /**
     * Total lines of content processed.
     */
    totalLines: number;

    /**
     * Number of JSON repair attempts made.
     */
    repairAttempts: number;

    /**
     * Reason for processing failure (if success is false).
     */
    failureReason?: string;

    /**
     * Provider that generated the response.
     */
    provider?: string;

    /**
     * Model that generated the response.
     */
    model?: string;

    /**
     * Custom metadata from the response or processing.
     */
    [key: string]: unknown;
  };
}

/**
 * Builder for creating GenerationResult objects with a fluent API.
 */
export class GenerationResultBuilder {
  private success: boolean = false;
  private generatedFiles: GeneratedFile[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];
  private metadata: GenerationResult['metadata'] = {
    processingTimeMs: 0,
    totalLines: 0,
    repairAttempts: 0,
  };

  /**
   * Set success status.
   */
  withSuccess(success: boolean): this {
    this.success = success;
    return this;
  }

  /**
   * Add generated files.
   */
  withGeneratedFiles(files: GeneratedFile[]): this {
    this.generatedFiles = files;
    return this;
  }

  /**
   * Add a single generated file.
   */
  addGeneratedFile(file: GeneratedFile): this {
    this.generatedFiles.push(file);
    return this;
  }

  /**
   * Add a warning message.
   */
  addWarning(warning: string): this {
    this.warnings.push(warning);
    return this;
  }

  /**
   * Add warnings in bulk.
   */
  withWarnings(warnings: string[]): this {
    this.warnings = warnings;
    return this;
  }

  /**
   * Add an error message.
   */
  addError(error: string): this {
    this.errors.push(error);
    return this;
  }

  /**
   * Add errors in bulk.
   */
  withErrors(errors: string[]): this {
    this.errors = errors;
    return this;
  }

  /**
   * Set metadata.
   */
  withMetadata(metadata: Partial<GenerationResult['metadata']>): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * Set processing time in milliseconds.
   */
  withProcessingTime(timeMs: number): this {
    this.metadata.processingTimeMs = timeMs;
    return this;
  }

  /**
   * Set total lines processed.
   */
  withTotalLines(lines: number): this {
    this.metadata.totalLines = lines;
    return this;
  }

  /**
   * Set number of repair attempts.
   */
  withRepairAttempts(attempts: number): this {
    this.metadata.repairAttempts = attempts;
    return this;
  }

  /**
   * Set failure reason.
   */
  withFailureReason(reason: string): this {
    this.metadata.failureReason = reason;
    return this;
  }

  /**
   * Set provider information.
   */
  withProvider(provider: string): this {
    this.metadata.provider = provider;
    return this;
  }

  /**
   * Set model information.
   */
  withModel(model: string): this {
    this.metadata.model = model;
    return this;
  }

  /**
   * Build the final GenerationResult.
   */
  build(): GenerationResult {
    // If there are errors and success is not explicitly set to true, mark as failed
    if (this.errors.length > 0 && this.success === false) {
      this.metadata.failureReason = this.errors[0];
    }

    return {
      success: this.success,
      generatedFiles: this.generatedFiles,
      warnings: this.warnings,
      errors: this.errors,
      metadata: this.metadata,
    };
  }
}
