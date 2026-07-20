import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Validates import statements in generated files.
 */
export class ImportValidator {
  /**
   * Validate imports in a file.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!file.content) {
      return violations;
    }

    // Extract imports from content
    const imports = this.extractImports(file.content);

    // Check for duplicate imports
    violations.push(...this.checkDuplicateImports(imports, file));

    // Check for circular imports (basic check)
    violations.push(...this.checkCircularImports(imports, file));

    // Check import paths exist and are valid
    violations.push(...this.validateImportPaths(imports, file));

    // Check for unused imports (basic check)
    violations.push(...this.checkUnusedImports(imports, file));

    return violations;
  }

  private extractImports(
    content: string,
  ): Array<{ path: string; specifiers: string[]; line: number }> {
    const imports: Array<{ path: string; specifiers: string[]; line: number }> = [];
    const lines = content.split('\n');

    let lineNumber = 0;
    for (const line of lines) {
      lineNumber++;

      // Match ES6 imports
      const match = line.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const specifiers = match[1] ? match[1].split(',').map((s) => s.trim()) : [match[2]];
        const path = match[3];
        imports.push({ path, specifiers, line: lineNumber });
      }
    }

    return imports;
  }

  private checkDuplicateImports(
    imports: Array<{ path: string; specifiers: string[]; line: number }>,
    file: GeneratedFile,
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];
    const seen = new Map<string, number>();

    for (const imp of imports) {
      if (seen.has(imp.path)) {
        violations.push(
          ValidationRuleFactory.createWarning(
            'IMPORT_DUPLICATE',
            'Duplicate Import',
            `Duplicate import from "${imp.path}" found (line ${imp.line} and line ${seen.get(imp.path)})`,
            'imports',
            `Combine imports: import { ${imp.specifiers.join(', ')} } from "${imp.path}"`,
            file,
            { line: imp.line, path: imp.path },
          ),
        );
      } else {
        seen.set(imp.path, imp.line);
      }
    }

    return violations;
  }

  private checkCircularImports(
    imports: Array<{ path: string; specifiers: string[]; line: number }>,
    file: GeneratedFile,
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Basic circular import check: if a file imports from same folder
    const currentFolder = file.path.substring(0, file.path.lastIndexOf('/'));

    for (const imp of imports) {
      // Check if import is relative and points back to same file
      if (imp.path.startsWith('.')) {
        const importedFile = this.resolveRelativePath(file.path, imp.path);
        if (importedFile === file.path) {
          violations.push(
            ValidationRuleFactory.createError(
              'IMPORT_SELF_REFERENCE',
              'Self-Referential Import',
              `File cannot import from itself: "${imp.path}"`,
              'imports',
              'Remove the self-referential import',
              file,
              { line: imp.line, path: imp.path },
            ),
          );
        }
      }
    }

    return violations;
  }

  private validateImportPaths(
    imports: Array<{ path: string; specifiers: string[]; line: number }>,
    file: GeneratedFile,
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];

    for (const imp of imports) {
      // Check if path uses automation alias or valid relative path
      if (imp.path.startsWith('@automation/')) {
        // Valid alias import
        violations.push(...this.validateAliasImport(imp, file));
      } else if (imp.path.startsWith('.')) {
        // Relative import - should use .js extension
        violations.push(...this.validateRelativeImport(imp, file));
      } else if (!imp.path.startsWith('node_modules')) {
        // Third-party imports are OK
      }
    }

    return violations;
  }

  private validateAliasImport(
    imp: { path: string; specifiers: string[]; line: number },
    file: GeneratedFile,
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check if import ends with .js
    if (!imp.path.endsWith('.js')) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'IMPORT_MISSING_EXTENSION',
          'Missing File Extension',
          `Import path "${imp.path}" should include .js extension`,
          'imports',
          `Change to: import { ${imp.specifiers.join(', ')} } from '${imp.path}.js'`,
          file,
          { line: imp.line, path: imp.path },
        ),
      );
    }

    return violations;
  }

  private validateRelativeImport(
    imp: { path: string; specifiers: string[]; line: number },
    file: GeneratedFile,
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Relative imports should end with .js
    if (!imp.path.endsWith('.js')) {
      violations.push(
        ValidationRuleFactory.createInfo(
          'IMPORT_MISSING_EXTENSION',
          'Missing File Extension',
          `Relative import "${imp.path}" should include .js extension for proper module resolution`,
          'imports',
          `Change to: import { ${imp.specifiers.join(', ')} } from '${imp.path}.js'`,
          file,
          { line: imp.line, path: imp.path },
        ),
      );
    }

    return violations;
  }

  private checkUnusedImports(
    imports: Array<{ path: string; specifiers: string[]; line: number }>,
    file: GeneratedFile,
  ): ValidationRule[] {
    const violations: ValidationRule[] = [];

    for (const imp of imports) {
      for (const specifier of imp.specifiers) {
        // Remove 'type' keyword if present
        const cleanSpecifier = specifier.replace(/^\s*type\s+/, '');

        // Check if specifier is used in file
        if (!this.isSpecifierUsed(cleanSpecifier, file.content, imp.line)) {
          violations.push(
            ValidationRuleFactory.createInfo(
              'IMPORT_UNUSED',
              'Unused Import',
              `Imported specifier "${cleanSpecifier}" from "${imp.path}" is not used in the file`,
              'imports',
              `Remove unused import: ${cleanSpecifier}`,
              file,
              { line: imp.line, specifier: cleanSpecifier },
            ),
          );
        }
      }
    }

    return violations;
  }

  private isSpecifierUsed(specifier: string, content: string, importLine: number): boolean {
    // Simple usage check - look for the specifier used as identifier
    const lines = content.split('\n');
    for (let i = importLine; i < lines.length; i++) {
      if (lines[i].includes(specifier)) {
        return true;
      }
    }
    return false;
  }

  private resolveRelativePath(currentPath: string, relativePath: string): string {
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const parts = relativePath.split('/');

    let resolved = currentDir;
    for (const part of parts) {
      if (part === '.') {
        // Stay in current directory
      } else if (part === '..') {
        // Go up one directory
        resolved = resolved.substring(0, resolved.lastIndexOf('/'));
      } else if (part) {
        resolved += '/' + part;
      }
    }

    return resolved;
  }
}
