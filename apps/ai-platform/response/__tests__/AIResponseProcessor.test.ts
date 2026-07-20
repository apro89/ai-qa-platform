import { describe, it, expect, beforeEach } from 'vitest';
import { AIResponseProcessor } from '../services/AIResponseProcessor.js';
import { AIResponse } from '../../llm/models/AIResponse.js';
import { AIUsage } from '../../llm/models/AIUsage.js';
import { LoggerFactory } from '../../logger/LoggerFactory.js';

describe('AIResponseProcessor - Integration Tests', () => {
  let processor: AIResponseProcessor;
  let loggerFactory: LoggerFactory;

  beforeEach(() => {
    loggerFactory = new LoggerFactory();
    const logger = loggerFactory.create('AIResponseProcessor');
    processor = new AIResponseProcessor(logger);
  });

  describe('process - valid responses', () => {
    it('should process valid JSON response', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'export class LoginTask {}',
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(1);
      expect(result.generatedFiles[0].path).toBe('tasks/LoginTask.ts');
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should process markdown-wrapped JSON', async () => {
      const usage = new AIUsage(100, 50);
      const content = `
Here's the generated response:

\`\`\`json
{
  "files": [
    {
      "path": "pages/LoginPage.ts",
      "type": "page",
      "content": "export class LoginPage {}"
    }
  ]
}
\`\`\`

Please use these generated files.
      `;

      const aiResponse = new AIResponse(content, usage, {
        provider: 'ollama',
        model: 'llama3.1',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(1);
      expect(result.generatedFiles[0].type).toBe('page');
    });

    it('should process multiple generated files', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
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
          {
            path: 'interactions/Click.ts',
            type: 'interaction',
            content: 'interaction code',
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(3);
    });

    it('should preserve file metadata', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'code',
            description: 'Login task',
            metadata: { version: '1.0', author: 'AI' },
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(true);
      expect(result.generatedFiles[0].description).toBe('Login task');
      expect(result.generatedFiles[0].metadata?.author).toBe('AI');
    });
  });

  describe('process - truncated responses', () => {
    it('should warn on truncated response', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'code',
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'length',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes('truncated'))).toBe(true);
    });
  });

  describe('process - filtered responses', () => {
    it('should fail on filtered response', async () => {
      const usage = new AIUsage(100, 50);
      const content = 'Some content';

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'content_filter',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes('content filter'))).toBe(true);
    });
  });

  describe('process - empty responses', () => {
    it('should fail on empty content', async () => {
      const usage = new AIUsage(100, 50);
      const aiResponse = new AIResponse('', usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('AI Response content is empty');
    });
  });

  describe('process - invalid JSON', () => {
    it('should fail on unparseable JSON after repair attempts', async () => {
      const usage = new AIUsage(100, 50);
      const content = 'completely invalid [[[';

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isResponseReady', () => {
    it('should return true for valid response', () => {
      const usage = new AIUsage(100, 50);
      const aiResponse = new AIResponse('content', usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      expect(processor.isResponseReady(aiResponse)).toBe(true);
    });

    it('should return false for empty content', () => {
      const usage = new AIUsage(100, 50);
      const aiResponse = new AIResponse('', usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      expect(processor.isResponseReady(aiResponse)).toBe(false);
    });

    it('should return false for null response', () => {
      expect(processor.isResponseReady(null as any)).toBe(false);
    });
  });

  describe('summarizeResponse', () => {
    it('should summarize complete response', () => {
      const usage = new AIUsage(100, 50);
      const aiResponse = new AIResponse('content', usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const summary = processor.summarizeResponse(aiResponse);
      expect(summary).toContain('Complete');
    });

    it('should summarize truncated response', () => {
      const usage = new AIUsage(100, 50);
      const aiResponse = new AIResponse('content', usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'length',
        createdAt: new Date(),
      });

      const summary = processor.summarizeResponse(aiResponse);
      expect(summary).toContain('Truncated');
    });
  });

  describe('metadata tracking', () => {
    it('should track provider information', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'code',
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'ollama',
        model: 'llama3.1',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.metadata.provider).toBe('ollama');
      expect(result.metadata.model).toBe('llama3.1');
    });

    it('should track processing time', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'code',
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should include processing report in metadata', async () => {
      const usage = new AIUsage(100, 50);
      const content = JSON.stringify({
        files: [
          {
            path: 'tasks/LoginTask.ts',
            type: 'task',
            content: 'code',
          },
        ],
      });

      const aiResponse = new AIResponse(content, usage, {
        provider: 'openai',
        model: 'gpt-4',
        finishReason: 'stop',
        createdAt: new Date(),
      });

      const result = await processor.process(aiResponse);

      expect(result.metadata.processingReport).toBeDefined();
      expect(result.metadata.processingReport.stage).toBe('complete');
    });
  });
});
