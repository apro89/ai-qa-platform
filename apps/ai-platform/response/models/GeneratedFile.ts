/**
 * Represents a single generated file in the response.
 */
export interface GeneratedFile {
  /**
   * File path relative to project root (e.g., 'tasks/LoginTask.ts')
   */
  path: string;

  /**
   * File type/category (e.g., 'task', 'question', 'interaction', 'page')
   */
  type: string;

  /**
   * File content (TypeScript code, markdown, etc.)
   */
  content: string;

  /**
   * Optional: Description or additional metadata
   */
  description?: string;

  /**
   * Optional: Any additional metadata specific to the file
   */
  metadata?: Record<string, unknown>;
}

/**
 * Factory for creating and validating GeneratedFile objects.
 */
export class GeneratedFileFactory {
  /**
   * Create a GeneratedFile with validation.
   */
  static create(
    path: string,
    type: string,
    content: string,
    description?: string,
    metadata?: Record<string, unknown>,
  ): GeneratedFile {
    this.validate(path, type, content);

    return {
      path,
      type,
      content,
      description,
      metadata,
    };
  }

  /**
   * Create from plain object with validation.
   */
  static fromObject(obj: unknown): GeneratedFile {
    if (!obj || typeof obj !== 'object') {
      throw new Error('GeneratedFile must be an object');
    }

    const file = obj as Record<string, unknown>;

    const path = file.path as string | undefined;
    const type = file.type as string | undefined;
    const content = file.content as string | undefined;
    const description = file.description as string | undefined;
    const metadata = file.metadata as Record<string, unknown> | undefined;

    if (!path || typeof path !== 'string') {
      throw new Error('GeneratedFile.path must be a non-empty string');
    }
    if (!type || typeof type !== 'string') {
      throw new Error('GeneratedFile.type must be a non-empty string');
    }
    if (!content || typeof content !== 'string') {
      throw new Error('GeneratedFile.content must be a non-empty string');
    }

    return this.create(path, type, content, description, metadata);
  }

  /**
   * Validate GeneratedFile properties.
   */
  private static validate(path: string, type: string, content: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('GeneratedFile.path cannot be empty');
    }

    if (!type || type.trim().length === 0) {
      throw new Error('GeneratedFile.type cannot be empty');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('GeneratedFile.content cannot be empty');
    }

    // Validate path format (should contain at least one character that looks like a filename)
    if (!path.includes('.') && !path.includes('/')) {
      throw new Error('GeneratedFile.path should include a file extension or directory separator');
    }
  }
}
