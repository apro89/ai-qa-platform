import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Detects conflicts with existing project structure.
 */
export class ProjectConflictDetector {
  private existingFilePaths: Set<string> = new Set();
  private forbiddenPaths: Set<string> = new Set();

  /**
   * Initialize with existing file paths.
   */
  setExistingFiles(files: string[]): void {
    this.existingFilePaths = new Set(files);
  }

  /**
   * Set forbidden paths that cannot be overwritten.
   */
  setForbiddenPaths(paths: string[]): void {
    this.forbiddenPaths = new Set(paths);
  }

  /**
   * Check for conflicts in a file.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check if file already exists
    violations.push(...this.checkFileExists(file));

    // Check if path is forbidden
    violations.push(...this.checkForbiddenPath(file));

    // Check for folder conflicts
    violations.push(...this.checkFolderConflicts(file));

    return violations;
  }

  private checkFileExists(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (this.existingFilePaths.has(file.path)) {
      violations.push(
        ValidationRuleFactory.createError(
          'CONFLICT_FILE_EXISTS',
          'File Already Exists',
          `File "${file.path}" already exists in the project`,
          'conflicts',
          'Either update the existing file or use a different path',
          file,
          { path: file.path },
        ),
      );
    }

    return violations;
  }

  private checkForbiddenPath(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (this.forbiddenPaths.has(file.path)) {
      violations.push(
        ValidationRuleFactory.createError(
          'CONFLICT_FORBIDDEN_PATH',
          'Forbidden Path',
          `File "${file.path}" is in a forbidden location and cannot be written`,
          'conflicts',
          'Choose a different location for this file',
          file,
          { path: file.path },
        ),
      );
    }

    return violations;
  }

  private checkFolderConflicts(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Extract folder path
    const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));

    // Check if folder structure is valid
    const validFolders = ['tasks', 'questions', 'interactions', 'pages', 'tests', 'config'];

    if (folderPath) {
      const topLevelFolder = folderPath.split('/')[0];
      if (!validFolders.includes(topLevelFolder)) {
        violations.push(
          ValidationRuleFactory.createWarning(
            'CONFLICT_INVALID_FOLDER',
            'Invalid Folder Structure',
            `File location "${folderPath}" uses unexpected folder structure`,
            'conflicts',
            `Use one of: ${validFolders.join(', ')}`,
            file,
            { folder: topLevelFolder, validFolders },
          ),
        );
      }
    }

    return violations;
  }
}
