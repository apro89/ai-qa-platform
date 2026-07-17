/**
 * ContextCompressor
 *
 * Reduces context size while preserving essential information.
 */

import type { Logger } from '../logger/Logger.js';

export class ContextCompressor {
  constructor(
    private readonly logger: Logger,
    private readonly maxContextSize: number = 50000,
  ) {}

  compress(context: unknown): unknown {
    const startSize = JSON.stringify(context).length;

    // Strategy 1: Remove null/undefined values
    let compressed = this.removeNullValues(context);

    // Strategy 2: Deduplicate similar items
    compressed = this.deduplicateItems(compressed);

    // Strategy 3: Summarize long descriptions
    compressed = this.summarizeTexts(compressed);

    // Strategy 4: Truncate if still too large
    if (JSON.stringify(compressed).length > this.maxContextSize) {
      compressed = this.truncate(compressed);
    }

    const endSize = JSON.stringify(compressed).length;
    const ratio = startSize / endSize;

    this.logger.debug('Context compressed', {
      originalSize: startSize,
      compressedSize: endSize,
      ratio: ratio.toFixed(2),
    });

    return compressed;
  }

  private removeNullValues(obj: unknown): unknown {
    if (obj === null || obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.filter(v => v !== null && v !== undefined).map(v => this.removeNullValues(v));
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const cleaned = this.removeNullValues(value);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result;
  }

  private deduplicateItems(obj: unknown): unknown {
    if (!Array.isArray(obj)) return obj;
    const seen = new Set<string>();
    return obj.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private summarizeTexts(obj: unknown, maxLength: number = 200): unknown {
    if (typeof obj === 'string') {
      return obj.length > maxLength ? obj.substring(0, maxLength) + '...' : obj;
    }
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.summarizeTexts(item, maxLength));
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = this.summarizeTexts(value, maxLength);
    }
    return result;
  }

  private truncate(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
    const essential: Record<string, unknown> = {};
    const essentialKeys = ['name', 'path', 'framework', 'architecture', 'namingConventions'];
    for (const key of essentialKeys) {
      if (key in (obj as Record<string, unknown>)) {
        essential[key] = (obj as Record<string, unknown>)[key];
      }
    }
    return essential;
  }
}
