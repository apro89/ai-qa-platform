import type { Logger } from '../../logger/Logger.js';
import { JsonExtractor } from './JsonExtractor.js';
import { JsonRepair } from './JsonRepair.js';
import { ResponseValidator } from './ResponseValidator.js';
import type { ExpectedSchema, ValidationResult } from './ResponseValidator.js';
import { ProcessingReportBuilder } from '../models/ProcessingReport.js';

/**
 * Parsing result containing extracted and validated data.
 */
export interface ParsingResult {
  extractedJson: string;
  parsedObject: ExpectedSchema;
  validationResult: ValidationResult;
  repairAttempted: boolean;
  report: ReturnType<ProcessingReportBuilder['build']>;
}

/**
 * Orchestrates the complete response parsing pipeline.
 *
 * Pipeline stages:
 * 1. Extract JSON from response content (handles various formats)
 * 2. Attempt to repair malformed JSON (if needed)
 * 3. Validate against schema
 * 4. Generate comprehensive report
 */
export class ResponseParser {
  private readonly extractor: JsonExtractor;
  private readonly repair: JsonRepair;
  private readonly validator: ResponseValidator;
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.extractor = new JsonExtractor();
    this.repair = new JsonRepair();
    this.validator = new ResponseValidator();
  }

  /**
   * Parse AIResponse content into structured GeneratedFile objects.
   */
  parse(content: string, processingId: string): ParsingResult {
    const reportBuilder = new ProcessingReportBuilder(processingId);
    const startTime = performance.now();

    this.logger.info('Response parsing started', { processingId });

    try {
      reportBuilder.setProviderInfo('unknown', 'unknown', 'unknown');

      // Stage 1: Extract JSON
      this.logger.debug('Stage 1: Extracting JSON', { processingId });
      reportBuilder.setStage('extraction');
      reportBuilder.setStatistics({
        inputLengthChars: content.length,
        totalLines: content.split('\n').length,
      });

      let extractedJson: string;
      try {
        extractedJson = this.extractor.extract(content);
        this.logger.debug('JSON extracted successfully', {
          processingId,
          extractedLength: extractedJson.length,
        });
        reportBuilder.setExtractedContent(extractedJson);
        reportBuilder.setJsonExtractionSucceeded(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error('JSON extraction failed', { processingId, error: message });
        reportBuilder.addError(message, 'JSON_EXTRACTION_ERROR');
        reportBuilder.setStage('failed');

        throw err;
      }

      reportBuilder.addValidationCheck('JSON extracted from content', true);

      // Stage 2: Parse and repair if needed
      this.logger.debug('Stage 2: Attempting to parse JSON', { processingId });
      reportBuilder.setStage('repair');

      let parsedObject: ExpectedSchema;
      let repairAttempted = false;

      try {
        parsedObject = JSON.parse(extractedJson) as ExpectedSchema;
        this.logger.debug('JSON parsed successfully', { processingId });
        reportBuilder.addValidationCheck('Valid JSON structure', true);
      } catch (err) {
        // JSON is invalid, attempt repairs
        repairAttempted = true;
        const parseError = err instanceof Error ? err.message : String(err);
        this.logger.warn('JSON parsing failed, attempting repair', { processingId, parseError });

        try {
          extractedJson = this.repair.repair(extractedJson);
          reportBuilder.recordRepairAttempt('Invalid JSON', 'JSON repair strategies', true);
          this.logger.debug('JSON repair successful', { processingId });

          parsedObject = JSON.parse(extractedJson) as ExpectedSchema;
          this.logger.info('JSON parsed after repair', { processingId });
          reportBuilder.addValidationCheck('Valid JSON after repair', true);
        } catch (repairErr) {
          const repairError = repairErr instanceof Error ? repairErr.message : String(repairErr);
          this.logger.error('JSON repair failed', { processingId, error: repairError });
          reportBuilder.addError(repairError, 'JSON_REPAIR_ERROR');
          reportBuilder.setStage('failed');

          throw repairErr;
        }
      }

      // Stage 3: Validate against schema
      this.logger.debug('Stage 3: Validating against schema', { processingId });
      reportBuilder.setStage('validation');

      const validationResult = this.validator.validate(parsedObject);

      for (const error of validationResult.errors) {
        this.logger.error('Validation error', { processingId, error });
        reportBuilder.addError(error, 'VALIDATION_ERROR');
        reportBuilder.addValidationCheck(error, false);
      }

      for (const warning of validationResult.warnings) {
        this.logger.warn('Validation warning', { processingId, warning });
        reportBuilder.addWarning(warning, 'medium');
        reportBuilder.addValidationCheck(warning, true);
      }

      if (validationResult.isValid) {
        this.logger.info('Validation passed', {
          processingId,
          fileCount: validationResult.generatedFiles.length,
        });
      }

      // Stage 4: Build report
      reportBuilder.setStage(validationResult.isValid ? 'complete' : 'failed');
      reportBuilder.setStatistics({
        outputFileCount: validationResult.generatedFiles.length,
        totalOutputLengthChars: validationResult.generatedFiles.reduce(
          (sum, file) => sum + file.content.length,
          0,
        ),
      });

      const endTime = performance.now();
      reportBuilder.setStatistics({ processingTimeMs: endTime - startTime });

      const report = reportBuilder.build();

      this.logger.info('Response parsing completed', {
        processingId,
        success: validationResult.isValid,
        fileCount: validationResult.generatedFiles.length,
        processingTimeMs: report.statistics.processingTimeMs,
      });

      return {
        extractedJson,
        parsedObject,
        validationResult,
        repairAttempted,
        report,
      };
    } catch (err) {
      const endTime = performance.now();
      reportBuilder.setStatistics({ processingTimeMs: endTime - startTime });
      const error = err instanceof Error ? err.message : String(err);
      reportBuilder.setStage('failed');
      reportBuilder.setStatistics({ processingTimeMs: endTime - startTime });

      const report = reportBuilder.build();

      this.logger.error('Response parsing failed with exception', {
        processingId,
        error,
        processingTimeMs: report.statistics.processingTimeMs,
      });

      throw err;
    }
  }
}
