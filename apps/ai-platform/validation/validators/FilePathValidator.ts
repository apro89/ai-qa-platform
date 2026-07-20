import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Validates file paths conform to project standards.
 */
export class FilePathValidator {
  private readonly validExtensions = new Set(['.ts', '.js', '.md', '.json', '.yaml', '.yml']);

  private readonly allowedFolders = new Set([
    'tasks',
    'questions',
    'interactions',
    'pages',
    'tests',
    'config',
    'abilities',
    'actors',
    'models',
    'utils',
    'data',
    'fixtures',
  ]);

  /**
   * Validate file path.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check file extension
    violations.push(...this.validateExtension(file));

    // Check folder structure
    violations.push(...this.validateFolderStructure(file));

    // Check path format
    violations.push(...this.validatePathFormat(file));

    return violations;
  }

  private validateExtension(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    const ext = this.getFileExtension(file.path);
    if (!this.validExtensions.has(ext)) {
      violations.push(
        ValidationRuleFactory.createError(
          'FILE_PATH_INVALID_EXTENSION',
          'Invalid File Extension',
          `File "${file.path}" has unsupported extension "${ext}"`,
          'file-path',
          `Use one of: ${Array.from(this.validExtensions).join(', ')}`,
          file,
          { extension: ext },
        ),
      );
    }

    return violations;
  }

  private validateFolderStructure(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    const pathParts = file.path.split('/');
    if (pathParts.length === 0) {
      return violations;
    }

    const topLevelFolder = pathParts[0];

    // Check if top-level folder is allowed
    if (!this.allowedFolders.has(topLevelFolder)) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'FILE_PATH_INVALID_FOLDER',
          'Invalid Top-Level Folder',
          `File is in "${topLevelFolder}" folder, which is not a standard location`,
          'file-path',
          `Use one of: ${Array.from(this.allowedFolders).join(', ')}`,
          file,
          { folder: topLevelFolder },
        ),
      );
    }

    // Validate folder matches file type
    violations.push(...this.validateFolderTypeMatch(file));

    return violations;
  }

  private validateFolderTypeMatch(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    const pathParts = file.path.split('/');
    const topLevelFolder = pathParts[0];

    // Map file types to expected folders
    const typeToFolderMap: Record<string, string[]> = {
      task: ['tasks'],
      question: ['questions'],
      interaction: ['interactions'],
      page: ['pages'],
      test: ['tests'],
      ability: ['abilities'],
      actor: ['actors'],
      model: ['models'],
      fixture: ['fixtures'],
      config: ['config'],
    };

    const expectedFolders = typeToFolderMap[file.type];
    if (expectedFolders && !expectedFolders.includes(topLevelFolder)) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'FILE_PATH_TYPE_MISMATCH',
          'File Type and Folder Mismatch',
          `${file.type} should be in "${expectedFolders[0]}" folder, not "${topLevelFolder}"`,
          'file-path',
          `Move file to: ${expectedFolders[0]}/${pathParts.slice(1).join('/')}`,
          file,
          { type: file.type, currentFolder: topLevelFolder, expectedFolders },
        ),
      );
    }

    return violations;
  }

  private validatePathFormat(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check for invalid characters
    if (/[^a-zA-Z0-9\-_./]/.test(file.path)) {
      violations.push(
        ValidationRuleFactory.createError(
          'FILE_PATH_INVALID_CHARS',
          'Invalid Path Characters',
          `File path "${file.path}" contains invalid characters`,
          'file-path',
          'Use only alphanumeric characters, hyphens, underscores, dots, and slashes',
          file,
          { path: file.path },
        ),
      );
    }

    // Check for double slashes
    if (file.path.includes('//')) {
      violations.push(
        ValidationRuleFactory.createError(
          'FILE_PATH_DOUBLE_SLASH',
          'Double Slashes in Path',
          `File path "${file.path}" contains double slashes`,
          'file-path',
          'Remove duplicate slashes',
          file,
          { path: file.path },
        ),
      );
    }

    // Check for trailing slash
    if (file.path.endsWith('/')) {
      violations.push(
        ValidationRuleFactory.createError(
          'FILE_PATH_TRAILING_SLASH',
          'Trailing Slash in Path',
          `File path "${file.path}" ends with a slash`,
          'file-path',
          'Remove trailing slash',
          file,
          { path: file.path },
        ),
      );
    }

    // Check if filename is present
    const filename = file.path.split('/').pop();
    if (!filename || filename.length === 0) {
      violations.push(
        ValidationRuleFactory.createError(
          'FILE_PATH_NO_FILENAME',
          'Missing Filename',
          `File path "${file.path}" does not include a filename`,
          'file-path',
          'Ensure path includes a filename (e.g., tasks/LoginTask.ts)',
          file,
          { path: file.path },
        ),
      );
    }

    return violations;
  }

  private getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf('.');
    if (lastDot === -1) {
      return '';
    }
    return path.substring(lastDot);
  }
}
