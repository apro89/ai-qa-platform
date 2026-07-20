import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import type { ValidationRule } from '../models/ValidationRule.js';
import { ValidationRuleFactory } from '../models/ValidationRule.js';

/**
 * Performs basic TypeScript validation on generated code.
 */
export class TypeScriptValidator {
  /**
   * Validate TypeScript code.
   */
  validate(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    if (!file.content) {
      return violations;
    }

    // Check syntax basics
    violations.push(...this.validateSyntax(file));

    // Check TypeScript types
    violations.push(...this.validateTypes(file));

    // Check exports
    violations.push(...this.validateExports(file));

    return violations;
  }

  private validateSyntax(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check for matching braces
    violations.push(...this.checkMatchingBraces(file));

    // Check for matching parentheses
    violations.push(...this.checkMatchingParens(file));

    // Check for unclosed strings
    violations.push(...this.checkUnclosedStrings(file));

    return violations;
  }

  private checkMatchingBraces(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    const openBraces = (file.content.match(/{/g) || []).length;
    const closeBraces = (file.content.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      violations.push(
        ValidationRuleFactory.createError(
          'TYPESCRIPT_UNMATCHED_BRACES',
          'Unmatched Braces',
          `File has ${openBraces} opening braces but ${closeBraces} closing braces`,
          'syntax',
          'Check brace matching in code',
          file,
          { openCount: openBraces, closeCount: closeBraces },
        ),
      );
    }

    return violations;
  }

  private checkMatchingParens(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    const openParens = (file.content.match(/\(/g) || []).length;
    const closeParens = (file.content.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      violations.push(
        ValidationRuleFactory.createError(
          'TYPESCRIPT_UNMATCHED_PARENS',
          'Unmatched Parentheses',
          `File has ${openParens} opening parentheses but ${closeParens} closing parentheses`,
          'syntax',
          'Check parenthesis matching in code',
          file,
          { openCount: openParens, closeCount: closeParens },
        ),
      );
    }

    return violations;
  }

  private checkUnclosedStrings(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Count unescaped quotes
    const singleQuotes = this.countUnescapedQuotes(file.content, "'");
    const doubleQuotes = this.countUnescapedQuotes(file.content, '"');
    const backticks = this.countUnescapedQuotes(file.content, '`');

    if (singleQuotes % 2 !== 0) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'TYPESCRIPT_UNCLOSED_STRING',
          'Unclosed String',
          `File appears to have unclosed single quote strings`,
          'syntax',
          'Check for missing closing quotes',
          file,
        ),
      );
    }

    if (doubleQuotes % 2 !== 0) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'TYPESCRIPT_UNCLOSED_STRING',
          'Unclosed String',
          `File appears to have unclosed double quote strings`,
          'syntax',
          'Check for missing closing quotes',
          file,
        ),
      );
    }

    if (backticks % 2 !== 0) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'TYPESCRIPT_UNCLOSED_STRING',
          'Unclosed Template String',
          `File appears to have unclosed template strings`,
          'syntax',
          'Check for missing closing backticks',
          file,
        ),
      );
    }

    return violations;
  }

  private validateTypes(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check for missing type annotations in key places
    if (file.content.includes('function') && !file.content.includes(': void')) {
      // This is a basic check - might generate false positives
      violations.push(
        ValidationRuleFactory.createInfo(
          'TYPESCRIPT_MISSING_TYPE_ANNOTATION',
          'Missing Type Annotation',
          'Consider adding explicit return type annotations to functions',
          'types',
          'Add return type: function name(): ReturnType { ... }',
          file,
        ),
      );
    }

    // Check for 'any' type (anti-pattern)
    if (file.content.includes(': any')) {
      violations.push(
        ValidationRuleFactory.createWarning(
          'TYPESCRIPT_ANY_TYPE',
          'Using Any Type',
          'Code uses "any" type which bypasses type checking',
          'types',
          'Use specific types instead of "any"',
          file,
        ),
      );
    }

    return violations;
  }

  private validateExports(file: GeneratedFile): ValidationRule[] {
    const violations: ValidationRule[] = [];

    // Check that file has exports (except for special files)
    if (
      !file.path.includes('.test.') &&
      !file.path.includes('.spec.') &&
      !file.content.includes('export ')
    ) {
      violations.push(
        ValidationRuleFactory.createInfo(
          'TYPESCRIPT_NO_EXPORTS',
          'No Exports Found',
          `File "${file.path}" does not export anything`,
          'exports',
          'Add export statements for public APIs',
          file,
        ),
      );
    }

    return violations;
  }

  private countUnescapedQuotes(content: string, quote: string): number {
    let count = 0;
    let escaped = false;

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\\') {
        escaped = !escaped;
      } else if (content[i] === quote && !escaped) {
        count++;
      } else {
        escaped = false;
      }
    }

    return count;
  }
}
