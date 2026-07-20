/**
 * Phase 7: Validation & Quality Engine
 *
 * This module implements the validation layer between the AI response processing
 * engine and the filesystem writer. All generated code must pass through this
 * quality gate before it can be written to the project.
 */

// Models
export type { ValidatedGeneration, ValidationReport } from './models/ValidatedGeneration.js';
export { ValidatedGenerationBuilder } from './models/ValidatedGeneration.js';
export type { ValidationRule } from './models/ValidationRule.js';
export { ValidationRuleFactory } from './models/ValidationRule.js';
export type { ValidationResult } from './models/ValidationResult.js';
export { ValidationResultBuilder } from './models/ValidationResult.js';
export {
  ValidationSeverity,
  getSeverityLevel,
  compareSeverity,
} from './models/ValidationSeverity.js';

// Services (Orchestration)
export { ValidationEngine } from './services/ValidationEngine.js';
export { ValidationPipeline } from './services/ValidationPipeline.js';

// Validators
export { NamingConventionValidator } from './validators/NamingConventionValidator.js';
export { ImportValidator } from './validators/ImportValidator.js';
export { ScreenplayValidator } from './validators/ScreenplayValidator.js';
export { DuplicateDetector } from './validators/DuplicateDetector.js';
export { ProjectConflictDetector } from './validators/ProjectConflictDetector.js';
export { FilePathValidator } from './validators/FilePathValidator.js';
export { TypeScriptValidator } from './validators/TypeScriptValidator.js';
export { CodeQualityValidator } from './validators/CodeQualityValidator.js';

// Errors
export {
  ValidationEngineError,
  NamingConventionError,
  ImportValidationError,
  ScreenplayValidationError,
  DuplicateObjectError,
  ConflictError,
  FilePathValidationError,
  TypeScriptValidationError,
  ValidationPipelineError,
} from './errors/index.js';
