import { describe, it, expect } from 'vitest';
import { GeneratedFileFactory } from '../models/GeneratedFile.js';
import { GenerationResultBuilder } from '../models/GenerationResult.js';
import { ProcessingReportBuilder } from '../models/ProcessingReport.js';

describe('GeneratedFile', () => {
  describe('factory - create', () => {
    it('should create valid GeneratedFile', () => {
      const file = GeneratedFileFactory.create(
        'tasks/LoginTask.ts',
        'task',
        'export class LoginTask {}',
      );

      expect(file.path).toBe('tasks/LoginTask.ts');
      expect(file.type).toBe('task');
      expect(file.content).toBe('export class LoginTask {}');
    });

    it('should include optional description and metadata', () => {
      const file = GeneratedFileFactory.create(
        'tasks/LoginTask.ts',
        'task',
        'code',
        'Login task description',
        { version: '1.0' },
      );

      expect(file.description).toBe('Login task description');
      expect(file.metadata?.version).toBe('1.0');
    });
  });

  describe('factory - fromObject', () => {
    it('should create from plain object', () => {
      const obj = {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'code',
      };

      const file = GeneratedFileFactory.fromObject(obj);

      expect(file.path).toBe('tasks/LoginTask.ts');
    });

    it('should throw on invalid path', () => {
      const obj = { path: '', type: 'task', content: 'code' };

      expect(() => GeneratedFileFactory.fromObject(obj)).toThrow();
    });

    it('should throw on missing required fields', () => {
      expect(() => GeneratedFileFactory.fromObject({ path: 'test.ts' })).toThrow();
      expect(() => GeneratedFileFactory.fromObject({ type: 'task' })).toThrow();
      expect(() => GeneratedFileFactory.fromObject({ content: 'code' })).toThrow();
    });
  });
});

describe('GenerationResult', () => {
  describe('builder - fluent API', () => {
    it('should build successful result', () => {
      const result = new GenerationResultBuilder()
        .withSuccess(true)
        .addGeneratedFile(GeneratedFileFactory.create('tasks/LoginTask.ts', 'task', 'code'))
        .withProcessingTime(100)
        .build();

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(1);
      expect(result.metadata.processingTimeMs).toBe(100);
    });

    it('should build failed result', () => {
      const result = new GenerationResultBuilder()
        .withSuccess(false)
        .addError('Processing failed')
        .withFailureReason('Unknown error')
        .build();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Processing failed');
      expect(result.metadata.failureReason).toBe('Unknown error');
    });

    it('should accumulate warnings and errors', () => {
      const result = new GenerationResultBuilder()
        .withSuccess(true)
        .addWarning('Warning 1')
        .addWarning('Warning 2')
        .addError('Error 1')
        .build();

      expect(result.warnings).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });

    it('should set provider information', () => {
      const result = new GenerationResultBuilder()
        .withSuccess(true)
        .withProvider('ollama')
        .withModel('llama3.1')
        .build();

      expect(result.metadata.provider).toBe('ollama');
      expect(result.metadata.model).toBe('llama3.1');
    });

    it('should set statistics', () => {
      const result = new GenerationResultBuilder()
        .withSuccess(true)
        .withTotalLines(50)
        .withRepairAttempts(2)
        .build();

      expect(result.metadata.totalLines).toBe(50);
      expect(result.metadata.repairAttempts).toBe(2);
    });
  });
});

describe('ProcessingReport', () => {
  describe('builder', () => {
    it('should build complete report', () => {
      const report = new ProcessingReportBuilder('proc_123')
        .setStage('complete')
        .setExtractedContent('{"files": []}')
        .setJsonExtractionSucceeded(true)
        .recordRepairAttempt('Trailing comma', 'remove trailing commas', true)
        .addValidationCheck('Has files array', true)
        .addWarning('Response truncated', 'high')
        .setProviderInfo('openai', 'gpt-4', 'stop')
        .setStatistics({
          inputLengthChars: 1000,
          outputFileCount: 2,
          totalOutputLengthChars: 500,
        })
        .build();

      expect(report.processingId).toBe('proc_123');
      expect(report.stage).toBe('complete');
      expect(report.jsonExtractionSucceeded).toBe(true);
      expect(report.repairAttempts).toBe(1);
      expect(report.validationChecks).toHaveLength(1);
      expect(report.warnings).toHaveLength(1);
      expect(report.providerInfo?.provider).toBe('openai');
      expect(report.statistics.inputLengthChars).toBe(1000);
    });

    it('should track repair attempts', () => {
      const report = new ProcessingReportBuilder('proc_123')
        .recordRepairAttempt('Issue 1', 'Strategy 1', true)
        .recordRepairAttempt('Issue 2', 'Strategy 2', false)
        .recordRepairAttempt('Issue 1 again', 'Strategy 1', true)
        .build();

      expect(report.repairAttempts).toBe(3);
      expect(report.repairDetails).toHaveLength(3);
      expect(report.repairDetails[0].attempt).toBe(1);
      expect(report.repairDetails[2].attempt).toBe(3);
    });

    it('should accumulate validation checks', () => {
      const report = new ProcessingReportBuilder('proc_123')
        .addValidationCheck('Check 1', true)
        .addValidationCheck('Check 2', false, 'Check 2 failed')
        .addValidationCheck('Check 3', true)
        .build();

      expect(report.validationChecks).toHaveLength(3);
    });

    it('should accumulate errors and warnings', () => {
      const report = new ProcessingReportBuilder('proc_123')
        .addWarning('Warning 1', 'low')
        .addWarning('Warning 2', 'high')
        .addError('Error 1', 'ERROR_CODE_1')
        .addError('Error 2', 'ERROR_CODE_2', 'stack trace here')
        .build();

      expect(report.warnings).toHaveLength(2);
      expect(report.errors).toHaveLength(2);
      expect(report.errors[0].code).toBe('ERROR_CODE_1');
      expect(report.errors[1].stack).toBe('stack trace here');
    });

    it('should calculate processing time', () => {
      const startTime = Date.now();
      const report = new ProcessingReportBuilder('proc_123').build();

      // Processing time should be small but non-negative
      expect(report.statistics.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(report.completedAt).toBeDefined();
    });

    it('should calculate compression ratio', () => {
      const report = new ProcessingReportBuilder('proc_123')
        .setStatistics({
          inputLengthChars: 1000,
          totalOutputLengthChars: 500,
        })
        .build();

      expect(report.statistics.compressionRatio).toBe(0.5);
    });
  });
});
