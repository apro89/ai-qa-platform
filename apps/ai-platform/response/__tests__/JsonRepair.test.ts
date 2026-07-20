import { describe, it, expect, beforeEach } from 'vitest';
import { JsonRepair } from '../services/JsonRepair.js';
import { JsonParseError } from '../errors/ResponseProcessingError.js';

describe('JsonRepair', () => {
  let repair: JsonRepair;

  beforeEach(() => {
    repair = new JsonRepair();
  });

  describe('repair - valid JSON', () => {
    it('should pass through already valid JSON', () => {
      const json = '{"files": [{"path": "test.ts", "type": "task", "content": "code"}]}';
      const result = repair.repair(json);
      expect(result).toBe(json);
    });
  });

  describe('repair - trailing commas', () => {
    it('should remove trailing comma in object', () => {
      const malformed = '{"key": "value",}';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('should remove trailing comma in array', () => {
      const malformed = '["item1", "item2",]';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual(['item1', 'item2']);
    });

    it('should handle multiple trailing commas', () => {
      const malformed = '{"files": [{"path": "test.ts",},],}';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({
        files: [{ path: 'test.ts' }],
      });
    });
  });

  describe('repair - single quotes', () => {
    it('should convert single quotes to double quotes for keys', () => {
      const malformed = "{'key': 'value'}";
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('should convert single quotes in arrays', () => {
      const malformed = "['item1', 'item2']";
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual(['item1', 'item2']);
    });
  });

  describe('repair - unquoted keys', () => {
    it('should add quotes to unquoted object keys', () => {
      const malformed = '{key: "value"}';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('should handle multiple unquoted keys', () => {
      const malformed = '{key1: "value1", key2: "value2"}';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('repair - missing brackets', () => {
    it('should add missing closing brace', () => {
      const malformed = '{"key": "value"';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('should add missing closing bracket', () => {
      const malformed = '["item1", "item2"';
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual(['item1', 'item2']);
    });
  });

  describe('repair - complex cases', () => {
    it('should repair JSON with multiple issues', () => {
      const malformed = "{key: 'value', items: [1, 2,],}";
      const result = repair.repair(malformed);
      expect(JSON.parse(result)).toEqual({ key: 'value', items: [1, 2] });
    });

    it('should handle nested structures', () => {
      const malformed = '{"files": [{"path": "test.ts", type: "task",}]}';
      const result = repair.repair(malformed);
      const parsed = JSON.parse(result);
      expect(parsed.files).toHaveLength(1);
      expect(parsed.files[0].path).toBe('test.ts');
      expect(parsed.files[0].type).toBe('task');
    });
  });

  describe('repair - error handling', () => {
    it('should throw error on empty string', () => {
      expect(() => repair.repair('')).toThrow(JsonParseError);
    });

    it('should throw error if unable to repair', () => {
      const unrepairable = 'completely invalid [[[';
      expect(() => repair.repair(unrepairable)).toThrow(JsonParseError);
    });
  });

  describe('getStrategySummary', () => {
    it('should return repair strategies', () => {
      const summary = repair.getStrategySummary();
      expect(summary).toContain('trailing commas');
      expect(summary).toContain('single quotes');
      expect(summary).toContain('property names');
    });
  });
});
