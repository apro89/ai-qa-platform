import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Validates code quality metrics.
 */
export class CodeQualityValidator {
  private readonly maxLineLength = 120;
  private readonly maxFunctionLength = 50; // lines
  private readonly minFunctionLength = 3; // lines

  /**
   * Validate code quality.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!file.content) {
      return violations;
    }

    const lines = file.content.split('\n');

    // Check line length
    violations.push(...this.checkLineLength(lines, file));

    // Check function complexity
    violations.push(...this.checkFunctionLength(lines, file));

    // Check code comments
    violations.push(...this.checkComments(lines, file));

    // Check naming consistency
    violations.push(...this.checkNamingConsistency(file));

    return violations;
  }

  private checkLineLength(lines: string[], file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    let longLineCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > this.maxLineLength) {
        longLineCount++;
        if (longLineCount <= 3) {
          // Report first 3 violations
          violations.push(
            ValidationRuleFactory.createInfo(
              'CODE_QUALITY_LONG_LINE',
              'Long Line',
              `Line ${i + 1} is ${lines[i].length} characters (max: ${this.maxLineLength})`,
              'code-quality',
              'Consider breaking into multiple lines',
              file,
              { lineNumber: i + 1, length: lines[i].length },
            ),
          );
        }
      }
    }

    if (longLineCount > 3) {
      violations.push(
        ValidationRuleFactory.createInfo(
          'CODE_QUALITY_MANY_LONG_LINES',
          'Multiple Long Lines',
          `File has ${longLineCount} lines exceeding ${this.maxLineLength} character limit`,
          'code-quality',
          'Consider refactoring long lines',
          file,
          { longLineCount, maxLineLength: this.maxLineLength },
        ),
      );
    }

    return violations;
  }

  private checkFunctionLength(lines: string[], file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    let inFunction = false;
    let functionStart = 0;
    let functionLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for function start (basic pattern)
      if (/(async\s+)?[\w]+\s*\(.*\)\s*[:{]/.test(line)) {
        inFunction = true;
        functionStart = i;
        functionLines = 0;
      }

      if (inFunction) {
        functionLines++;

        // Check for function end
        if (line.includes('}')) {
          if (functionLines > this.maxFunctionLength) {
            violations.push(
              ValidationRuleFactory.createWarning(
                'CODE_QUALITY_FUNCTION_TOO_LONG',
                'Function Too Long',
                `Function at line ${functionStart + 1} is ${functionLines} lines (max: ${this.maxFunctionLength})`,
                'code-quality',
                'Consider breaking into smaller functions',
                file,
                { startLine: functionStart + 1, length: functionLines },
              ),
            );
          }
          inFunction = false;
        }
      }
    }

    return violations;
  }

  private checkComments(lines: string[], file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    const commentLines = lines.filter((l) => l.includes('//')).length;
    const docCommentLines = lines.filter((l) => l.includes('/**')).length;

    const commentRatio = commentLines / lines.length;

    // Warn if very few comments
    if (commentRatio < 0.05 && lines.length > 20) {
      violations.push(
        ValidationRuleFactory.createInfo(
          'CODE_QUALITY_LOW_COMMENTS',
          'Low Comment Coverage',
          `File has only ${Math.round(commentRatio * 100)}% comments. Consider adding more documentation.`,
          'code-quality',
          'Add explanatory comments for complex logic',
          file,
          { commentRatio, docComments: docCommentLines },
        ),
      );
    }

    return violations;
  }

  private checkNamingConsistency(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Extract variable names
    const variableNames = this.extractVariableNames(file.content);

    // Check for inconsistent naming (mixing camelCase and snake_case)
    const hasCamelCase = variableNames.some((n) => /[a-z][A-Z]/.test(n));
    const hasSnakeCase = variableNames.some((n) => /_[a-z]/.test(n));

    if (hasCamelCase && hasSnakeCase) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'CODE_QUALITY_INCONSISTENT_NAMING',
          'Inconsistent Naming Convention',
          'File mixes camelCase and snake_case naming styles',
          'code-quality',
          'Use consistent naming: camelCase for variables, PascalCase for classes',
          file,
        ),
      );
    }

    return violations;
  }

  private extractVariableNames(content: string): string[] {
    const names: string[] = [];
    const pattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      names.push(match[1]);
    }

    return names;
  }
}
