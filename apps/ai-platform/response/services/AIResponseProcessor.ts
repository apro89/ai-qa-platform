import type { AIResponse } from '../../llm/models/AIResponse.js';
import type { Logger } from '../../logger/Logger.js';
import { ResponseParser } from './ResponseParser.js';
import { GenerationResultBuilder } from '../models/GenerationResult.js';
import type { GenerationResult } from '../models/GenerationResult.js';

/**
 * Main orchestrator for the AI Response Processing Engine.
 *
 * Responsibilities:
 * - Receive provider-independent AIResponse
 * - Coordinate complete processing pipeline
 * - Handle errors gracefully
 * - Return validated GenerationResult
 *
 * Architecture:
 * AIResponse → ResponseParser → GeneratedFiles → GenerationResult
 */
export class AIResponseProcessor {
  private readonly parser: ResponseParser;
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.parser = new ResponseParser(logger);
  }

  /**
   * Process a provider-independent AIResponse into a GenerationResult.
   *
   * This is the main entry point for the response processing engine.
   */
  async process(aiResponse: AIResponse): Promise<GenerationResult> {
    const processingId = this.generateProcessingId();
    const startTime = performance.now();

    this.logger.info('Processing AI response', {
      processingId,
      provider: aiResponse.metadata.provider,
      model: aiResponse.metadata.model,
      finishReason: aiResponse.metadata.finishReason,
      contentLength: aiResponse.content.length,
    });

    const resultBuilder = new GenerationResultBuilder()
      .withProvider(aiResponse.metadata.provider)
      .withModel(aiResponse.metadata.model)
      .withProcessingTime(0) // Will update at end
      .withTotalLines(aiResponse.content.split('\n').length);

    try {
      // Validate AIResponse
      if (!aiResponse.content || aiResponse.content.trim().length === 0) {
        const error = 'AI Response content is empty';
        this.logger.error(error, { processingId });
        resultBuilder.withSuccess(false).addError(error);

        const endTime = performance.now();
        return resultBuilder
          .withProcessingTime(Math.round(endTime - startTime))
          .withFailureReason(error)
          .build();
      }

      // Check if response was truncated
      if (aiResponse.isTruncated()) {
        this.logger.warn('AI Response was truncated', { processingId });
        resultBuilder.addWarning(
          'Response was truncated due to token limit. Generated output may be incomplete.',
        );
      }

      // Check if response was filtered
      if (aiResponse.isFiltered()) {
        const error = 'AI Response was blocked by content filter';
        this.logger.error(error, { processingId });
        resultBuilder.withSuccess(false).addError(error);

        const endTime = performance.now();
        return resultBuilder
          .withProcessingTime(Math.round(endTime - startTime))
          .withFailureReason(error)
          .build();
      }

      // Parse and process response
      this.logger.debug('Parsing response content', { processingId });

      const parsingResult = this.parser.parse(aiResponse.content, processingId);

      // Collect results from parsing
      if (parsingResult.validationResult.isValid) {
        this.logger.info('Response validation successful', {
          processingId,
          fileCount: parsingResult.validationResult.generatedFiles.length,
          warnings: parsingResult.validationResult.warnings.length,
        });

        resultBuilder
          .withSuccess(true)
          .withGeneratedFiles(parsingResult.validationResult.generatedFiles)
          .withWarnings(parsingResult.validationResult.warnings)
          .withRepairAttempts(parsingResult.repairAttempted ? 1 : 0);
      } else {
        this.logger.error('Response validation failed', {
          processingId,
          errors: parsingResult.validationResult.errors,
          warnings: parsingResult.validationResult.warnings,
        });

        resultBuilder
          .withSuccess(false)
          .withErrors(parsingResult.validationResult.errors)
          .withWarnings(parsingResult.validationResult.warnings)
          .withRepairAttempts(parsingResult.repairAttempted ? 1 : 0)
          .withFailureReason(parsingResult.validationResult.errors[0]);
      }

      // Update metadata from report
      resultBuilder.withMetadata({
        processingReport: parsingResult.report,
      });

      const endTime = performance.now();
      resultBuilder.withProcessingTime(Math.round(endTime - startTime));

      const result = resultBuilder.build();

      this.logger.info('AI response processing completed', {
        processingId,
        success: result.success,
        processingTimeMs: result.metadata.processingTimeMs,
        fileCount: result.generatedFiles.length,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;

      this.logger.error('AI response processing failed with exception', {
        processingId,
        error,
        stack,
      });

      resultBuilder
        .withSuccess(false)
        .addError(`Processing failed: ${error}`)
        .withFailureReason(error);

      const endTime = performance.now();
      return resultBuilder.withProcessingTime(Math.round(endTime - startTime)).build();
    }
  }

  /**
   * Generate a unique processing ID for tracking and logging.
   */
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Check if an AIResponse is ready for processing.
   */
  isResponseReady(aiResponse: AIResponse): boolean {
    return (
      aiResponse !== null &&
      aiResponse !== undefined &&
      aiResponse.content !== null &&
      aiResponse.content !== undefined &&
      aiResponse.content.trim().length > 0
    );
  }

  /**
   * Get a summary of response quality.
   */
  summarizeResponse(aiResponse: AIResponse): string {
    const parts = [];

    if (aiResponse.isComplete()) {
      parts.push('✓ Complete');
    }
    if (aiResponse.isTruncated()) {
      parts.push('⚠ Truncated');
    }
    if (aiResponse.isFiltered()) {
      parts.push('✗ Filtered');
    }

    return parts.join(', ') || 'Unknown status';
  }
}
