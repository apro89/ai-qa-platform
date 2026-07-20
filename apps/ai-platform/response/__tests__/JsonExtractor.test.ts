import { describe, it, expect, beforeEach } from 'vitest';
import { JsonExtractor } from '../services/JsonExtractor.js';
import { UnsupportedFormatError, JsonParseError } from '../errors/ResponseProcessingError.js';

describe('JsonExtractor', () => {
  let extractor: JsonExtractor;

  beforeEach(() => {
    extractor = new JsonExtractor();
  });

  describe('extract - plain JSON', () => {
    it('should extract plain JSON object', () => {
      const json = '{"files": [{"path": "test.ts", "type": "task", "content": "code"}]}';
      const result = extractor.extract(json);
      expect(result).toBe(json);
    });

    it('should extract plain JSON array', () => {
      const json = '[{"path": "test.ts", "type": "task", "content": "code"}]';
      const result = extractor.extract(json);
      expect(result).toBe(json);
    });

    it('should trim whitespace from plain JSON', () => {
      const json = '  \n\n{"files": []}\n\n  ';
      const result = extractor.extract(json);
      expect(result).toBe('{"files": []}');
    });
  });

  describe('extract - markdown wrapped JSON', () => {
    it('should extract JSON from ```json``` code block', () => {
      const content =
        '```json\n{"files": [{"path": "test.ts", "type": "task", "content": "code"}]}\n```';
      const result = extractor.extract(content);
      expect(result).toBe('{"files": [{"path": "test.ts", "type": "task", "content": "code"}]}');
    });

    it('should extract JSON from ``` ``` code block (without language)', () => {
      const content = '```\n{"files": []}\n```';
      const result = extractor.extract(content);
      expect(result).toBe('{"files": []}');
    });

    it('should handle multiple backticks', () => {
      const content = '```````json\n{"files": []}\n```````';
      const result = extractor.extract(content);
      expect(result).toBe('{"files": []}');
    });
  });

  describe('extract - JSON in text', () => {
    it('should extract JSON from mixed text content', () => {
      const content = `
Here is the generated response:

{"files": [{"path": "test.ts", "type": "task", "content": "code"}]}

Please use this response.
      `;
      const result = extractor.extract(content);
      expect(result).toBe('{"files": [{"path": "test.ts", "type": "task", "content": "code"}]}');
    });

    it('should extract nested JSON objects correctly', () => {
      const content = `{"outer": {"inner": {"files": []}}}`;
      const result = extractor.extract(content);
      expect(result).toBe('{"outer": {"inner": {"files": []}}}');
    });

    it('should handle JSON with nested arrays', () => {
      const json = '{"files": [{"path": "a.ts"}, {"path": "b.ts"}]}';
      const result = extractor.extract(json);
      expect(result).toBe(json);
    });
  });

  describe('extract - error handling', () => {
    it('should throw error on empty string', () => {
      expect(() => extractor.extract('')).toThrow(JsonParseError);
    });

    it('should throw error on null', () => {
      expect(() => extractor.extract(null as any)).toThrow(UnsupportedFormatError);
    });

    it('should throw error when no JSON found', () => {
      const content = 'This is just plain text with no JSON structure';
      expect(() => extractor.extract(content)).toThrow(JsonParseError);
    });
  });

  describe('isValidJson', () => {
    it('should validate correct JSON', () => {
      expect(extractor.isValidJson('{"key": "value"}')).toBe(true);
      expect(extractor.isValidJson('[]')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(extractor.isValidJson('{invalid}')).toBe(false);
      expect(extractor.isValidJson("{'key': 'value'}")).toBe(false);
    });
  });

  describe('getPreview', () => {
    it('should return full content if shorter than max length', () => {
      const content = 'short';
      expect(extractor.getPreview(content, 10)).toBe('short');
    });

    it('should truncate content and add ellipsis', () => {
      const content = 'this is a very long string';
      const result = extractor.getPreview(content, 10);
      expect(result).toBe('this is a ...');
    });
  });
});
