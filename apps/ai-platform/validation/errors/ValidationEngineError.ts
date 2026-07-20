/**
 * Base error class for validation failures.
 */
export class ValidationEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ValidationEngineError';
    Object.setPrototypeOf(this, ValidationEngineError.prototype);
  }
}

/**
 * Error validating file naming conventions.
 */
export class NamingConventionError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NAMING_CONVENTION_ERROR', context);
    this.name = 'NamingConventionError';
    Object.setPrototypeOf(this, NamingConventionError.prototype);
  }
}

/**
 * Error with imports validation.
 */
export class ImportValidationError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'IMPORT_VALIDATION_ERROR', context);
    this.name = 'ImportValidationError';
    Object.setPrototypeOf(this, ImportValidationError.prototype);
  }
}

/**
 * Error with Screenplay pattern validation.
 */
export class ScreenplayValidationError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SCREENPLAY_VALIDATION_ERROR', context);
    this.name = 'ScreenplayValidationError';
    Object.setPrototypeOf(this, ScreenplayValidationError.prototype);
  }
}

/**
 * Error detecting duplicates.
 */
export class DuplicateObjectError extends ValidationEngineError {
  constructor(objectName: string, existingPath: string, context?: Record<string, unknown>) {
    super(
      `Duplicate object detected: "${objectName}" already exists at "${existingPath}"`,
      'DUPLICATE_OBJECT_ERROR',
      { objectName, existingPath, ...context },
    );
    this.name = 'DuplicateObjectError';
    Object.setPrototypeOf(this, DuplicateObjectError.prototype);
  }
}

/**
 * Error detecting project conflicts.
 */
export class ConflictError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', context);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error validating file paths.
 */
export class FilePathValidationError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FILE_PATH_VALIDATION_ERROR', context);
    this.name = 'FilePathValidationError';
    Object.setPrototypeOf(this, FilePathValidationError.prototype);
  }
}

/**
 * Error validating TypeScript code.
 */
export class TypeScriptValidationError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TYPESCRIPT_VALIDATION_ERROR', context);
    this.name = 'TypeScriptValidationError';
    Object.setPrototypeOf(this, TypeScriptValidationError.prototype);
  }
}

/**
 * Error in validation pipeline.
 */
export class ValidationPipelineError extends ValidationEngineError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_PIPELINE_ERROR', context);
    this.name = 'ValidationPipelineError';
    Object.setPrototypeOf(this, ValidationPipelineError.prototype);
  }
}
