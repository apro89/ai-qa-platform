/**
 * Unit tests for Validation Engine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { GeneratedFile } from '@automation/response/models/GeneratedFile.js';
import { ValidationEngine } from '../services/ValidationEngine.js';
import { ValidationSeverity } from '../models/ValidationSeverity.js';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  describe('NamingConventionValidator', () => {
    it('should detect missing Task suffix', async () => {
      const file: GeneratedFile = {
        path: 'tasks/Login.ts',
        type: 'task',
        content: 'export class Login extends Task {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasNamingViolation = result.violations.some((v) => v.ruleId === 'NAMING_TASK_SUFFIX');
      expect(hasNamingViolation).toBe(true);
    });

    it('should allow proper Task naming', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasNamingErrors = result.violations.some(
        (v) => v.severity === ValidationSeverity.ERROR && v.category === 'naming',
      );
      expect(hasNamingErrors).toBe(false);
    });

    it('should detect missing Question suffix', async () => {
      const file: GeneratedFile = {
        path: 'questions/IsLoggedIn.ts',
        type: 'question',
        content: 'export class IsLoggedIn extends Question {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasNamingViolation = result.violations.some(
        (v) => v.ruleId === 'NAMING_QUESTION_SUFFIX',
      );
      expect(hasNamingViolation).toBe(true);
    });
  });

  describe('FilePathValidator', () => {
    it('should detect invalid file extension', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.js',
        type: 'task',
        content: 'export class LoginTask {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasPathViolation = result.violations.some(
        (v) => v.ruleId === 'FILE_PATH_INVALID_EXTENSION',
      );
      expect(hasPathViolation).toBe(true);
    });

    it('should allow proper file path', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasPathErrors = result.violations.some(
        (v) => v.severity === ValidationSeverity.ERROR && v.category === 'file-path',
      );
      expect(hasPathErrors).toBe(false);
    });
  });

  describe('TypeScriptValidator', () => {
    it('should detect unmatched braces', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask { async perform() { }',
      };

      const result = await engine.getPipeline().validate(file);

      const hasBraceViolation = result.violations.some(
        (v) => v.ruleId === 'TYPESCRIPT_UNMATCHED_BRACES',
      );
      expect(hasBraceViolation).toBe(true);
    });
  });

  describe('ScreenplayValidator', () => {
    it('should detect Task not extending Task class', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasScreenplayViolation = result.violations.some(
        (v) => v.ruleId === 'SCREENPLAY_WRONG_BASE_CLASS',
      );
      expect(hasScreenplayViolation).toBe(true);
    });

    it('should detect missing perform method in Task', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasMethodViolation = result.violations.some(
        (v) => v.ruleId === 'SCREENPLAY_MISSING_METHOD',
      );
      expect(hasMethodViolation).toBe(true);
    });

    it('should detect forbidden page.click in Task', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task { async perform() { page.click(); } }',
      };

      const result = await engine.getPipeline().validate(file);

      const hasForbiddenPattern = result.violations.some(
        (v) => v.ruleId === 'SCREENPLAY_FORBIDDEN_PATTERN',
      );
      expect(hasForbiddenPattern).toBe(true);
    });
  });

  describe('DuplicateDetector', () => {
    beforeEach(() => {
      engine.initializeWithProjectContext({
        existingTasks: ['LoginTask'],
      });
    });

    it('should detect duplicate Task', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task {}',
      };

      const result = await engine.getPipeline().validate(file);

      const hasDuplicateViolation = result.violations.some((v) => v.ruleId === 'DUPLICATE_TASK');
      expect(hasDuplicateViolation).toBe(true);
    });
  });

  describe('ImportValidator', () => {
    it('should warn about missing .js extension', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: "import { Actor } from '@automation/actors/Actor'",
      };

      const result = await engine.getPipeline().validate(file);

      const hasImportWarning = result.violations.some(
        (v) => v.ruleId === 'IMPORT_MISSING_EXTENSION',
      );
      expect(hasImportWarning).toBe(true);
    });

    it('should detect duplicate imports', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: `
          import { Actor } from '@automation/actors/Actor.js'
          import { Actor } from '@automation/actors/Actor.js'
        `,
      };

      const result = await engine.getPipeline().validate(file);

      const hasDuplicateImport = result.violations.some((v) => v.ruleId === 'IMPORT_DUPLICATE');
      expect(hasDuplicateImport).toBe(true);
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate correct quality score for clean file', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task { async perform(actor) {} }',
      };

      const result = await engine.getPipeline().validate(file);

      expect(result.qualityScore).toBeGreaterThan(50);
    });

    it('should reduce quality score for violations', async () => {
      const file: GeneratedFile = {
        path: 'tasks/BadTask.ts',
        type: 'task',
        content: 'export class BadTask { page.click(); }',
      };

      const result = await engine.getPipeline().validate(file);

      expect(result.qualityScore).toBeLessThan(50);
    });
  });

  describe('ValidationPipeline', () => {
    it('should execute validators in order', async () => {
      const file: GeneratedFile = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask extends Task { async perform() {} }',
      };

      const result = await engine.getPipeline().validate(file);

      expect(result.validatorsApplied.length).toBeGreaterThan(0);
      expect(result.validatorsApplied).toContain('FilePathValidator');
    });
  });
});
