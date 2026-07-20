/**
 * Base error class for response processing failures.
 */
export class ResponseProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ResponseProcessingError';
    Object.setPrototypeOf(this, ResponseProcessingError.prototype);
  }
}

/**
 * Error parsing JSON content.
 */
export class JsonParseError extends ResponseProcessingError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'JSON_PARSE_ERROR', context);
    this.name = 'JsonParseError';
    Object.setPrototypeOf(this, JsonParseError.prototype);
  }
}

/**
 * Error validating JSON against schema.
 */
export class JsonValidationError extends ResponseProcessingError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'JSON_VALIDATION_ERROR', context);
    this.name = 'JsonValidationError';
    Object.setPrototypeOf(this, JsonValidationError.prototype);
  }
}

/**
 * Error when required field is missing.
 */
export class MissingFieldError extends ResponseProcessingError {
  constructor(fieldName: string, context?: Record<string, unknown>) {
    super(`Required field missing: ${fieldName}`, 'MISSING_FIELD_ERROR', context);
    this.name = 'MissingFieldError';
    Object.setPrototypeOf(this, MissingFieldError.prototype);
  }
}

/**
 * Error when schema is invalid.
 */
export class InvalidSchemaError extends ResponseProcessingError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_SCHEMA_ERROR', context);
    this.name = 'InvalidSchemaError';
    Object.setPrototypeOf(this, InvalidSchemaError.prototype);
  }
}

/**
 * Error when response format is unsupported.
 */
export class UnsupportedFormatError extends ResponseProcessingError {
  constructor(format: string, context?: Record<string, unknown>) {
    super(`Unsupported format: ${format}`, 'UNSUPPORTED_FORMAT_ERROR', context);
    this.name = 'UnsupportedFormatError';
    Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
  }
}
