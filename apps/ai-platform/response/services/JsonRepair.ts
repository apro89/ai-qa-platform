import { JsonParseError } from '../errors/ResponseProcessingError.js';

/**
 * Strategy for attempting to repair malformed JSON.
 *
 * Handles common issues:
 * - Trailing commas in objects and arrays
 * - Single quotes instead of double quotes
 * - Missing quotes around property names
 * - Unescaped newlines in strings
 * - Missing closing brackets
 * - Common syntax errors
 */
export class JsonRepair {
  /**
   * Attempt to repair malformed JSON.
   * Returns repaired JSON string if successful, throws error if unable to repair.
   */
  repair(malformedJson: string): string {
    if (!malformedJson || typeof malformedJson !== 'string') {
      throw new JsonParseError('Input must be a non-empty string');
    }

    let repaired = malformedJson;
    const strategies = [
      { name: 'removeTrailingCommas', fn: () => this.removeTrailingCommas(repaired) },
      { name: 'fixUnescapedNewlines', fn: () => this.fixUnescapedNewlines(repaired) },
      { name: 'fixSingleQuotes', fn: () => this.fixSingleQuotes(repaired) },
      { name: 'fixUnquotedKeys', fn: () => this.fixUnquotedKeys(repaired) },
      { name: 'fixMissingClosingBrackets', fn: () => this.fixMissingClosingBrackets(repaired) },
      { name: 'removeTrailingCommas', fn: () => this.removeTrailingCommas(repaired) },
    ];

    for (const strategy of strategies) {
      try {
        const result = strategy.fn();
        if (this.isValidJson(result)) {
          return result;
        }
        repaired = result;
      } catch {
        // Strategy failed, try next one
      }
    }

    // If we still have invalid JSON, throw error
    if (!this.isValidJson(repaired)) {
      throw new JsonParseError('Unable to repair JSON after attempting all recovery strategies', {
        originalLength: malformedJson.length,
        repairedLength: repaired.length,
      });
    }

    return repaired;
  }

  /**
   * Remove trailing commas in objects and arrays.
   * Example: { "a": 1, } becomes { "a": 1 }
   */
  private removeTrailingCommas(json: string): string {
    return json.replace(/,(\s*[}\]])/g, '$1');
  }

  /**
   * Fix unescaped newlines in strings.
   * Replaces actual newlines within JSON strings with \n escape sequence.
   */
  private fixUnescapedNewlines(json: string): string {
    // This is tricky - we need to find newlines that are inside strings but not escaped
    // We'll use a regex to find string patterns and replace literal newlines with escaped ones
    return json.replace(/"([^"]*)\n([^"]*)"/, (match, p1, p2) => {
      return `"${p1}\\n${p2}"`;
    });
  }

  /**
   * Convert single quotes to double quotes (with care to not break contractions).
   * Example: { 'key': 'value' } becomes { "key": "value" }
   */
  private fixSingleQuotes(json: string): string {
    // Simple approach: replace single quotes used for JSON strings with double quotes
    // This handles: 'key': 'value' patterns
    let result = json;

    // Replace 'key': with "key":
    result = result.replace(/'([^']*)'(\s*:)/g, '"$1"$2');

    // Replace : 'value' with : "value"
    result = result.replace(/:\s*'([^']*)'(\s*[,}\]])/g, ': "$1"$2');

    // Replace , 'value' with , "value"
    result = result.replace(/,\s*'([^']*)'(\s*[,}\]])/g, ', "$1"$2');

    // Replace [ 'value' with [ "value"
    result = result.replace(/\[\s*'([^']*)'(\s*[,\]])/g, '[ "$1"$2');

    return result;
  }

  /**
   * Fix unquoted keys in objects.
   * Example: { key: "value" } becomes { "key": "value" }
   */
  private fixUnquotedKeys(json: string): string {
    // Match unquoted keys: word characters followed by colon (not inside quotes)
    // This regex looks for: key: or key :
    return json.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  }

  /**
   * Attempt to fix missing closing brackets.
   * Adds missing } or ] at the end if needed.
   */
  private fixMissingClosingBrackets(json: string): string {
    let result = json.trim();
    let depth = 0;

    // Track bracket depth
    for (let i = 0; i < result.length; i++) {
      const char = result[i];

      // Simple tracking (doesn't account for strings, but gives a rough idea)
      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
      }
    }

    // Add missing closing brackets
    while (depth > 0) {
      // Check what the last opening bracket was
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i] === '{') {
          result += '}';
          depth--;
          break;
        } else if (result[i] === '[') {
          result += ']';
          depth--;
          break;
        }
      }
    }

    return result;
  }

  /**
   * Check if string is valid JSON without throwing.
   */
  private isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get repair strategy summary for logging.
   */
  getStrategySummary(): string {
    return [
      '- Remove trailing commas',
      '- Fix unescaped newlines',
      '- Convert single quotes to double quotes',
      '- Add quotes to property names',
      '- Complete missing brackets',
    ].join('\n');
  }
}
