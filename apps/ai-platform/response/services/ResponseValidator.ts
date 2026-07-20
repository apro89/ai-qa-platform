import {
  JsonValidationError,
  MissingFieldError,
  InvalidSchemaError,
} from '../errors/ResponseProcessingError.js';
import type { GeneratedFile } from '../models/GeneratedFile.js';
import { GeneratedFileFactory } from '../models/GeneratedFile.js';

/**
 * Expected schema for parsed JSON responses.
 */
export interface ExpectedSchema {
  files: Array<{
    path: string;
    type: string;
    content: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

/**
 * Validation result with details.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  generatedFiles: GeneratedFile[];
}

/**
 * Validates parsed JSON against expected schema and business rules.
 *
 * Checks:
 * - Required fields exist
 * - Data types are correct
 * - File paths are valid
 * - Content is not empty
 * - File types are reasonable
 */
export class ResponseValidator {
  private readonly requiredFields = ['files'];
  private readonly requiredFileFields = ['path', 'type', 'content'];
  private readonly validFileTypes = [
    'task',
    'question',
    'interaction',
    'page',
    'test',
    'utility',
    'model',
    'service',
    'interface',
    'config',
  ];

  /**
   * Validate parsed JSON object.
   */
  validate(parsedJson: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const generatedFiles: GeneratedFile[] = [];

    // Validate that input is an object
    if (!parsedJson || typeof parsedJson !== 'object') {
      errors.push('Parsed JSON must be an object');
      return { isValid: false, errors, warnings, generatedFiles };
    }

    const json = parsedJson as Record<string, unknown>;

    // Validate required fields
    for (const field of this.requiredFields) {
      if (!(field in json)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings, generatedFiles };
    }

    // Check for unexpected top-level fields
    const expectedKeys = new Set(this.requiredFields);
    for (const key of Object.keys(json)) {
      if (!expectedKeys.has(key)) {
        warnings.push(`Unexpected field at root level: ${key}`);
      }
    }

    // Validate files array
    const files = json.files;
    if (!Array.isArray(files)) {
      errors.push('Field "files" must be an array');
      return { isValid: false, errors, warnings, generatedFiles };
    }

    if (files.length === 0) {
      warnings.push('No files found in response');
    }

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const fileResult = this.validateFile(files[i], i);
      errors.push(...fileResult.errors);
      warnings.push(...fileResult.warnings);
      if (fileResult.file) {
        generatedFiles.push(fileResult.file);
      }
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      generatedFiles,
    };
  }

  /**
   * Validate a single file object.
   */
  private validateFile(
    file: unknown,
    index: number,
  ): { errors: string[]; warnings: string[]; file?: GeneratedFile } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!file || typeof file !== 'object') {
      errors.push(`File at index ${index} must be an object`);
      return { errors, warnings };
    }

    const fileObj = file as Record<string, unknown>;

    // Check required fields
    for (const field of this.requiredFileFields) {
      if (!(field in fileObj)) {
        errors.push(`File at index ${index}: missing required field "${field}"`);
      }
    }

    if (errors.length > 0) {
      return { errors, warnings };
    }

    // Extract and validate fields
    const path = fileObj.path as string | undefined;
    const type = fileObj.type as string | undefined;
    const content = fileObj.content as string | undefined;
    const description = fileObj.description as string | undefined;
    const metadata = fileObj.metadata as Record<string, unknown> | undefined;

    // Validate path
    if (typeof path !== 'string' || path.trim().length === 0) {
      errors.push(`File at index ${index}: "path" must be a non-empty string`);
    } else if (!this.isValidFilePath(path)) {
      errors.push(`File at index ${index}: invalid file path format: ${path}`);
    }

    // Validate type
    if (typeof type !== 'string' || type.trim().length === 0) {
      errors.push(`File at index ${index}: "type" must be a non-empty string`);
    } else if (!this.validFileTypes.includes(type.toLowerCase())) {
      warnings.push(
        `File at index ${index}: unknown file type "${type}". Expected one of: ${this.validFileTypes.join(', ')}`,
      );
    }

    // Validate content
    if (typeof content !== 'string' || content.trim().length === 0) {
      errors.push(`File at index ${index}: "content" must be a non-empty string`);
    }

    // Check for unexpected fields
    const expectedFields = new Set(this.requiredFileFields.concat(['description', 'metadata']));
    for (const key of Object.keys(fileObj)) {
      if (!expectedFields.has(key)) {
        warnings.push(`File at index ${index}: unexpected field "${key}"`);
      }
    }

    // If no errors, create GeneratedFile
    if (errors.length === 0 && path && type && content) {
      try {
        const generatedFile = GeneratedFileFactory.create(
          path,
          type,
          content,
          description,
          metadata,
        );
        return { errors, warnings, file: generatedFile };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`File at index ${index}: ${message}`);
        return { errors, warnings };
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate file path format.
   */
  private isValidFilePath(path: string): boolean {
    // Path should contain at least one character that looks like a filename
    // and shouldn't have invalid characters for file paths
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(path)) {
      return false;
    }

    // Should have some structure (directory or extension)
    if (!path.includes('/') && !path.includes('.')) {
      return false;
    }

    return true;
  }

  /**
   * Get validation rules summary for logging/documentation.
   */
  getRulesSummary(): string {
    return [
      'Validation Rules:',
      '- Root object must contain "files" array',
      '- Each file must have: path (string), type (string), content (string)',
      '- Path must be valid file path format',
      `- Type should be one of: ${this.validFileTypes.join(', ')}`,
      '- Content must not be empty',
      '- Unknown fields generate warnings but do not fail validation',
    ].join('\n');
  }
}
