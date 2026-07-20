/**
 * AI Response Processing Engine
 *
 * Phase 6: Response Processing Engine
 *
 * Transforms provider-independent AIResponse objects into validated GenerationResult objects.
 * Handles extraction, repair, validation, and reporting of LLM responses.
 */

// Models
export {
  type GeneratedFile,
  GeneratedFileFactory,
  type GenerationResult,
  GenerationResultBuilder,
  type ProcessingReport,
  ProcessingReportBuilder,
} from './models/index.js';

// Services
export {
  JsonExtractor,
  JsonRepair,
  ResponseValidator,
  type ValidationResult,
  type ExpectedSchema,
  ResponseParser,
  type ParsingResult,
  AIResponseProcessor,
} from './services/index.js';

// Errors
export {
  ResponseProcessingError,
  JsonParseError,
  JsonValidationError,
  MissingFieldError,
  InvalidSchemaError,
  UnsupportedFormatError,
} from './errors/index.js';
