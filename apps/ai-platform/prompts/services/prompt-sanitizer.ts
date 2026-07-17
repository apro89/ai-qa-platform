/**
 * PromptSanitizer - Cleans prompt text
 */

import { createLogger } from '../../logger/index.js';

export class PromptSanitizer {
  private logger = createLogger('PromptSanitizer');

  sanitize(text: string): string {
    let sanitized = text;
    sanitized = this.normalizeLineEndings(sanitized);
    sanitized = this.removeDuplicateLines(sanitized);
    sanitized = this.normalizePunctuation(sanitized);
    sanitized = this.removeExcessiveWhitespace(sanitized);
    sanitized = this.escapeSpecialCharacters(sanitized);
    return sanitized;
  }

  private normalizeLineEndings(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  private removeDuplicateLines(text: string): string {
    const lines = text.split('\n');
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const line of lines) {
      const normalized = line.trim().toLowerCase();
      if (normalized.length === 0) {
        if (unique.length === 0 || unique[unique.length - 1].trim().length === 0) {
          continue;
        }
        unique.push(line);
      } else if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(line);
      }
    }

    return unique.join('\n');
  }

  private normalizePunctuation(text: string): string {
    let normalized = text;
    normalized = normalized.replace(/[""]/g, '"');
    normalized = normalized.replace(/['']/g, "'");
    normalized = normalized.replace(/\s+([.,:;!?])/g, '$1');
    normalized = normalized.replace(/\.(?=[a-z])/g, '. ');
    return normalized;
  }

  private removeExcessiveWhitespace(text: string): string {
    let cleaned = text
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');

    const lines = cleaned.split('\n');
    cleaned = lines.map(line => {
      if (line.includes('```') || line.match(/^\s{4}/)) {
        return line;
      }
      return line.replace(/  +/g, ' ');
    }).join('\n');

    cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
    cleaned = cleaned.replace(/^\n+|\n+$/g, '');

    return cleaned;
  }

  private escapeSpecialCharacters(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.includes('```')) {
        inCodeBlock = !inCodeBlock;
        result.push(line);
        continue;
      }

      if (inCodeBlock) {
        result.push(line);
        continue;
      }

      let escaped = line;
      if (!line.match(/^[#*-\d]/)) {
        escaped = escaped
          .replace(/\\/g, '\\\\')
          .replace(/\*/g, '\\*')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]');
      }

      result.push(escaped);
    }

    return result.join('\n');
  }

  removeLines(text: string, pattern: RegExp): string {
    return text.split('\n').filter(line => !pattern.test(line)).join('\n');
  }

  removeEmptyLines(text: string): string {
    return text.split('\n').filter(line => line.trim().length > 0).join('\n');
  }

  trimLines(text: string): string {
    return text.split('\n').map(line => line.trim()).join('\n');
  }

  getSanitizationReport(original: string, sanitized: string): {
    originalLength: number;
    sanitizedLength: number;
    reduction: number;
    reductionPercent: number;
  } {
    const originalLength = original.length;
    const sanitizedLength = sanitized.length;
    const reduction = originalLength - sanitizedLength;
    const reductionPercent = originalLength > 0 ? (reduction / originalLength) * 100 : 0;

    return { originalLength, sanitizedLength, reduction, reductionPercent };
  }
}
