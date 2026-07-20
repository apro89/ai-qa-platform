import { UnsupportedFormatError, JsonParseError } from '../errors/ResponseProcessingError.js';

/**
 * Extracts JSON from various response formats.
 *
 * Handles:
 * - Plain JSON
 * - Markdown wrapped JSON
 * - Code blocks (```json ... ```)
 * - Mixed content with embedded JSON
 * - Various delimiters and formats
 */
export class JsonExtractor {
  /**
   * Extract JSON from response content.
   * Attempts multiple extraction strategies in order of specificity.
   */
  extract(content: string): string {
    if (!content || typeof content !== 'string') {
      throw new UnsupportedFormatError('content must be a non-empty string');
    }

    const trimmed = content.trim();

    // Strategy 1: Try to find JSON code blocks (```json ... ```)
    const jsonCodeBlockMatch = this.extractFromCodeBlock(trimmed);
    if (jsonCodeBlockMatch) {
      return jsonCodeBlockMatch;
    }

    // Strategy 2: Try to find raw JSON objects/arrays
    const rawJsonMatch = this.extractRawJson(trimmed);
    if (rawJsonMatch) {
      return rawJsonMatch;
    }

    // Strategy 3: Try to find JSON within markdown or text
    const jsonInText = this.extractJsonFromText(trimmed);
    if (jsonInText) {
      return jsonInText;
    }

    // No JSON found
    throw new JsonParseError(
      'Could not extract JSON from response content. No valid JSON structure found.',
      {
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      },
    );
  }

  /**
   * Extract JSON from ```json ... ``` code blocks.
   */
  private extractFromCodeBlock(content: string): string | null {
    // Match ```json ... ``` or ```json<newline>...<newline>```
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/i,
      /```\s*json\s*([\s\S]*?)\s*```/i,
      /`{3,}json[\s\S]*?`{3,}/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract raw JSON object or array.
   * Looks for content starting with { or [ and ending with } or ]
   */
  private extractRawJson(content: string): string | null {
    // If content starts with { or [, try to parse it as JSON directly
    if ((content.startsWith('{') || content.startsWith('[')) && content.length > 2) {
      // Try to find the matching closing bracket
      const extracted = this.findMatchingBrackets(content);
      if (extracted) {
        return extracted;
      }
    }

    return null;
  }

  /**
   * Extract JSON from mixed text content.
   * Looks for { ... } or [ ... ] patterns within text.
   */
  private extractJsonFromText(content: string): string | null {
    // Find first { or [
    const objectStart = content.indexOf('{');
    const arrayStart = content.indexOf('[');

    let startIdx = -1;
    let startChar = '';

    if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
      startIdx = objectStart;
      startChar = '{';
    } else if (arrayStart !== -1) {
      startIdx = arrayStart;
      startChar = '[';
    }

    if (startIdx === -1) {
      return null;
    }

    // Try to find matching closing bracket
    const substring = content.substring(startIdx);
    const extracted = this.findMatchingBrackets(substring);

    if (extracted) {
      return extracted;
    }

    return null;
  }

  /**
   * Find matching closing bracket for opening bracket at position 0.
   */
  private findMatchingBrackets(text: string): string | null {
    if (!text || text.length < 2) {
      return null;
    }

    const openChar = text[0];
    let closeChar = '';

    if (openChar === '{') {
      closeChar = '}';
    } else if (openChar === '[') {
      closeChar = ']';
    } else {
      return null;
    }

    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return text.substring(0, i + 1);
        }
      }
    }

    // Didn't find matching bracket
    return null;
  }

  /**
   * Try to validate extracted JSON without throwing.
   * Returns true if valid, false otherwise.
   */
  isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a preview of content for logging/debugging.
   */
  getPreview(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
}
