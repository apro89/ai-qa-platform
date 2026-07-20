/**
 * Detailed report of processing operations.
 * Used for debugging, monitoring, and audit trails.
 */
export interface ProcessingReport {
  /**
   * Unique identifier for this processing operation.
   */
  processingId: string;

  /**
   * ISO 8601 timestamp when processing started.
   */
  startedAt: Date;

  /**
   * ISO 8601 timestamp when processing completed.
   */
  completedAt?: Date;

  /**
   * Current stage of processing.
   */
  stage: 'extraction' | 'repair' | 'validation' | 'complete' | 'failed';

  /**
   * Content extracted from the response.
   */
  extractedContent?: string;

  /**
   * Whether JSON extraction succeeded.
   */
  jsonExtractionSucceeded: boolean;

  /**
   * Number of repair operations attempted.
   */
  repairAttempts: number;

  /**
   * Details of each repair attempt.
   */
  repairDetails: Array<{
    attempt: number;
    issue: string;
    strategy: string;
    success: boolean;
  }>;

  /**
   * Validation checks performed.
   */
  validationChecks: Array<{
    check: string;
    passed: boolean;
    message?: string;
  }>;

  /**
   * Warnings accumulated during processing.
   */
  warnings: Array<{
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
  }>;

  /**
   * Errors encountered during processing.
   */
  errors: Array<{
    message: string;
    code: string;
    timestamp: Date;
    stack?: string;
  }>;

  /**
   * Processing statistics.
   */
  statistics: {
    inputLengthChars: number;
    outputFileCount: number;
    totalOutputLengthChars: number;
    compressionRatio: number;
    processingTimeMs: number;
  };

  /**
   * Provider metadata from the AIResponse.
   */
  providerInfo?: {
    provider: string;
    model: string;
    finishReason: string;
  };
}

/**
 * Builder for creating ProcessingReport objects.
 */
export class ProcessingReportBuilder {
  private processingId: string;
  private startedAt: Date;
  private completedAt?: Date;
  private stage: ProcessingReport['stage'] = 'extraction';
  private extractedContent?: string;
  private jsonExtractionSucceeded: boolean = false;
  private repairAttempts: number = 0;
  private repairDetails: ProcessingReport['repairDetails'] = [];
  private validationChecks: ProcessingReport['validationChecks'] = [];
  private warnings: ProcessingReport['warnings'] = [];
  private errors: ProcessingReport['errors'] = [];
  private statistics: ProcessingReport['statistics'] = {
    inputLengthChars: 0,
    outputFileCount: 0,
    totalOutputLengthChars: 0,
    compressionRatio: 0,
    processingTimeMs: 0,
  };
  private providerInfo?: ProcessingReport['providerInfo'];

  constructor(processingId: string) {
    this.processingId = processingId;
    this.startedAt = new Date();
  }

  /**
   * Set processing stage.
   */
  setStage(stage: ProcessingReport['stage']): this {
    this.stage = stage;
    return this;
  }

  /**
   * Set extracted content.
   */
  setExtractedContent(content: string): this {
    this.extractedContent = content;
    return this;
  }

  /**
   * Set JSON extraction success.
   */
  setJsonExtractionSucceeded(succeeded: boolean): this {
    this.jsonExtractionSucceeded = succeeded;
    return this;
  }

  /**
   * Record a repair attempt.
   */
  recordRepairAttempt(issue: string, strategy: string, success: boolean): this {
    this.repairAttempts += 1;
    this.repairDetails.push({
      attempt: this.repairAttempts,
      issue,
      strategy,
      success,
    });
    return this;
  }

  /**
   * Add validation check result.
   */
  addValidationCheck(check: string, passed: boolean, message?: string): this {
    this.validationChecks.push({ check, passed, message });
    return this;
  }

  /**
   * Add warning.
   */
  addWarning(message: string, severity: 'low' | 'medium' | 'high' = 'medium'): this {
    this.warnings.push({
      message,
      timestamp: new Date(),
      severity,
    });
    return this;
  }

  /**
   * Add error.
   */
  addError(message: string, code: string, stack?: string): this {
    this.errors.push({
      message,
      code,
      timestamp: new Date(),
      stack,
    });
    return this;
  }

  /**
   * Set processing statistics.
   */
  setStatistics(stats: Partial<ProcessingReport['statistics']>): this {
    this.statistics = { ...this.statistics, ...stats };
    return this;
  }

  /**
   * Set provider information.
   */
  setProviderInfo(provider: string, model: string, finishReason: string): this {
    this.providerInfo = { provider, model, finishReason };
    return this;
  }

  /**
   * Build the final report.
   */
  build(): ProcessingReport {
    const completedAt = new Date();
    const processingTimeMs = completedAt.getTime() - this.startedAt.getTime();

    // Update processing time in statistics
    this.statistics.processingTimeMs = processingTimeMs;

    // Calculate compression ratio
    if (this.statistics.inputLengthChars > 0 && this.statistics.totalOutputLengthChars > 0) {
      this.statistics.compressionRatio =
        this.statistics.totalOutputLengthChars / this.statistics.inputLengthChars;
    }

    return {
      processingId: this.processingId,
      startedAt: this.startedAt,
      completedAt,
      stage: this.stage,
      extractedContent: this.extractedContent,
      jsonExtractionSucceeded: this.jsonExtractionSucceeded,
      repairAttempts: this.repairAttempts,
      repairDetails: this.repairDetails,
      validationChecks: this.validationChecks,
      warnings: this.warnings,
      errors: this.errors,
      statistics: this.statistics,
      providerInfo: this.providerInfo,
    };
  }
}
