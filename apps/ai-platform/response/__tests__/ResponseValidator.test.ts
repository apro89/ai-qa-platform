import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseValidator } from '../services/ResponseValidator.js';
import type { ExpectedSchema } from '../services/ResponseValidator.js';

describe('ResponseValidator', () => {
  let validator: ResponseValidator;

  beforeEach(() => {
    validator = new ResponseValidator();
  });

  describe('validate - valid responses', () => {
    it('should validate correct response schema', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'export class LoginTask {}',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.generatedFiles).toHaveLength(1);
      expect(result.generatedFiles[0].path).toBe('tasks/LoginTask.ts');
    });

    it('should validate multiple files', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'task code',
          },
          {
            path: 'pages/LoginPage.ts',
            type: 'page',
            content: 'page code',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(true);
      expect(result.generatedFiles).toHaveLength(2);
    });

    it('should accept optional description and metadata', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'code',
            description: 'Login task',
            metadata: { version: '1.0' },
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(true);
      expect(result.generatedFiles[0].description).toBe('Login task');
    });
  });

  describe('validate - missing fields', () => {
    it('should reject response without files array', () => {
      const response = {} as ExpectedSchema;

      const result = validator.validate(response);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: files');
    });

    it('should reject file without path', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: '',
            type: 'task',
            content: 'code',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('path'))).toBe(true);
    });

    it('should reject file without type', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'test.ts',
            type: '',
            content: 'code',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('type'))).toBe(true);
    });

    it('should reject file without content', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'test.ts',
            type: 'task',
            content: '',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('content'))).toBe(true);
    });
  });

  describe('validate - invalid types', () => {
    it('should reject non-object input', () => {
      const result = validator.validate('not an object');

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('object'))).toBe(true);
    });

    it('should reject files that is not an array', () => {
      const response = { files: 'not an array' };

      const result = validator.validate(response);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('array'))).toBe(true);
    });

    it('should reject file that is not an object', () => {
      const response: ExpectedSchema = {
        files: ['not an object'],
      };

      const result = validator.validate(response);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validate - warnings', () => {
    it('should warn on empty files array', () => {
      const response: ExpectedSchema = {
        files: [],
      };

      const result = validator.validate(response);

      expect(result.warnings.some((w) => w.includes('No files'))).toBe(true);
    });

    it('should warn on unknown file type', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'test.ts',
            type: 'unknown_type',
            content: 'code',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.warnings.some((w) => w.includes('unknown file type'))).toBe(true);
      expect(result.isValid).toBe(true); // Still valid despite warning
    });

    it('should warn on unexpected fields', () => {
      const response: ExpectedSchema = {
        files: [
          {
            path: 'test.ts',
            type: 'task',
            content: 'code',
            unexpectedField: 'value',
          },
        ],
      };

      const result = validator.validate(response);

      expect(result.warnings.some((w) => w.includes('unexpected field'))).toBe(true);
      expect(result.isValid).toBe(true); // Still valid despite warning
    });

    it('should warn on unexpected root-level fields', () => {
      const response = {
        files: [],
        extraField: 'value',
      } as any;

      const result = validator.validate(response);

      expect(result.warnings.some((w) => w.includes('Unexpected field'))).toBe(true);
    });
  });

  describe('validate - file path validation', () => {
    it('should reject invalid file paths', () => {
      const invalidPaths = ['test', 'a', 'test<invalid>', 'test"invalid"'];

      for (const path of invalidPaths) {
        const response: ExpectedSchema = {
          files: [
            {
              path,
              type: 'task',
              content: 'code',
            },
          ],
        };

        const result = validator.validate(response);
        expect(result.isValid).toBe(false, `Path "${path}" should be invalid`);
      }
    });

    it('should accept valid file paths', () => {
      const validPaths = [
        'tasks/LoginTask.ts',
        'pages/login.page.ts',
        'utils/helpers.ts',
        'config/index.ts',
        'src/utils/helpers.ts',
      ];

      for (const path of validPaths) {
        const response: ExpectedSchema = {
          files: [
            {
              path,
              type: 'task',
              content: 'code',
            },
          ],
        };

        const result = validator.validate(response);
        expect(result.isValid).toBe(true, `Path "${path}" should be valid`);
      }
    });
  });

  describe('getRulesSummary', () => {
    it('should return validation rules', () => {
      const summary = validator.getRulesSummary();

      expect(summary).toContain('Validation Rules');
      expect(summary).toContain('files');
      expect(summary).toContain('path');
      expect(summary).toContain('type');
      expect(summary).toContain('content');
    });
  });
});
