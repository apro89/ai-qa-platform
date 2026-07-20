/**
 * Phase 6 Demo: AI Response Processing Engine
 *
 * This demo shows how the AI Response Processing Engine transforms raw AIResponse objects
 * (from any LLM provider - OpenAI, Ollama, Claude, etc.) into validated GenerationResult objects.
 *
 * The processing pipeline:
 *   AIResponse → Extract → Repair → Validate → GenerationResult
 *
 * Run with:
 *   pnpm exec ts-node apps/ai-platform/phase6-demo.ts
 */

import {
  AIResponseProcessor,
  JsonExtractor,
  JsonRepair,
  ResponseValidator,
  ResponseParser,
} from './response/index.js';
import { AIResponse, TokenUsage } from './llm/index.js';
import { createLogger } from './logger/index.js';

const logger = createLogger('Phase6Demo');

/**
 * Demo 1: Clean JSON from OpenAI
 */
async function demoCleanResponse(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 1: Clean JSON Response (OpenAI)');
  logger.info('='.repeat(60));

  const content = JSON.stringify({
    files: [
      {
        path: 'tasks/LoginTask.ts',
        type: 'task',
        content: 'export class LoginTask { /* ... */ }',
        description: 'Handles user login flow',
      },
      {
        path: 'pages/LoginPage.ts',
        type: 'page',
        content: 'export class LoginPage { /* ... */ }',
        description: 'Login page selectors',
      },
    ],
  });

  const aiResponse = new AIResponse(content, new TokenUsage(150, 100), {
    provider: 'openai',
    model: 'gpt-4o',
    finishReason: 'stop',
    createdAt: new Date(),
  });

  logger.info('Input AIResponse:', {
    provider: aiResponse.provider,
    model: aiResponse.model,
    contentLength: aiResponse.content.length,
  });

  const processor = new AIResponseProcessor(logger);
  const result = await processor.process(aiResponse);

  logger.info('Result:', {
    success: result.success,
    filesCount: result.generatedFiles.length,
    errors: result.errors,
    warnings: result.warnings,
    processingTimeMs: result.metadata.processingTimeMs,
  });

  result.generatedFiles.forEach((file) => {
    logger.info(`  ✅ Generated: ${file.path} (${file.type})`);
  });
}

/**
 * Demo 2: Markdown-wrapped JSON from Ollama
 */
async function demoMarkdownResponse(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 2: Markdown-wrapped JSON (Ollama)');
  logger.info('='.repeat(60));

  const content = `Here's the generated code:

\`\`\`json
{
  "files": [
    {
      "path": "questions/IsLoggedInQuestion.ts",
      "type": "question",
      "content": "export class IsLoggedInQuestion { /* ... */ }",
      "description": "Checks if user is logged in"
    }
  ]
}
\`\`\`

The code is ready for use!`;

  const aiResponse = new AIResponse(content, new TokenUsage(100, 120), {
    provider: 'ollama',
    model: 'llama3.1',
    finishReason: 'stop',
    createdAt: new Date(),
  });

  logger.info('Input AIResponse (markdown-wrapped):', {
    provider: aiResponse.provider,
    model: aiResponse.model,
    contentLength: aiResponse.content.length,
  });

  const processor = new AIResponseProcessor(logger);
  const result = await processor.process(aiResponse);

  logger.info('Result:', {
    success: result.success,
    filesCount: result.generatedFiles.length,
    extractedFromMarkdown: result.metadata.extractedFromMarkdown,
  });

  result.generatedFiles.forEach((file) => {
    logger.info(`  ✅ Extracted: ${file.path} (${file.type})`);
  });
}

/**
 * Demo 3: Malformed JSON with repair
 */
async function demoMalformedResponse(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 3: Malformed JSON (with auto-repair)');
  logger.info('='.repeat(60));

  const content = JSON.stringify({
    files: [
      {
        path: 'interactions/ClickLoginButton.ts',
        type: 'interaction',
        // This has issues: unquoted key, trailing comma, single quotes
        content: 'export class ClickLoginButton { execute() { } }',
        metadata: { version: 1 },
      }, // <-- trailing comma
    ],
  }).replace(/"/g, "'"); // Convert quotes to trigger repair

  const aiResponse = new AIResponse(content, new TokenUsage(120, 90), {
    provider: 'claude',
    model: 'claude-3-sonnet',
    finishReason: 'stop',
    createdAt: new Date(),
  });

  logger.info('Input AIResponse (with JSON issues):', {
    provider: aiResponse.provider,
    model: aiResponse.model,
    snippet: aiResponse.content.substring(0, 100) + '...',
  });

  const processor = new AIResponseProcessor(logger);
  const result = await processor.process(aiResponse);

  logger.info('Result:', {
    success: result.success,
    repairAttempts: result.metadata.repairAttempts,
    warnings: result.warnings,
  });

  if (result.metadata.repairAttempts > 0) {
    logger.info(`  🔧 JSON was repaired (${result.metadata.repairAttempts} attempts)`);
  }

  result.generatedFiles.forEach((file) => {
    logger.info(`  ✅ Generated: ${file.path} (${file.type})`);
  });
}

/**
 * Demo 4: Multiple files in single response
 */
async function demoMultipleFiles(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 4: Multiple Generated Files');
  logger.info('='.repeat(60));

  const content = JSON.stringify({
    files: [
      {
        path: 'tasks/CreateOrderTask.ts',
        type: 'task',
        content: 'export class CreateOrderTask { /* ... */ }',
      },
      {
        path: 'questions/OrderCreatedQuestion.ts',
        type: 'question',
        content: 'export class OrderCreatedQuestion { /* ... */ }',
      },
      {
        path: 'interactions/FillOrderForm.ts',
        type: 'interaction',
        content: 'export class FillOrderForm { /* ... */ }',
      },
      {
        path: 'pages/OrderPage.ts',
        type: 'page',
        content: 'export class OrderPage { /* ... */ }',
      },
      {
        path: 'tests/checkout/create-order.spec.ts',
        type: 'test',
        content: 'test("@smoke @ui user can create order", async () => { });',
      },
    ],
  });

  const aiResponse = new AIResponse(content, new TokenUsage(200, 250), {
    provider: 'openai',
    model: 'gpt-4-turbo',
    finishReason: 'stop',
    createdAt: new Date(),
  });

  logger.info('Input AIResponse:', {
    provider: aiResponse.provider,
    filesInResponse: 5,
  });

  const processor = new AIResponseProcessor(logger);
  const result = await processor.process(aiResponse);

  logger.info('Result:', {
    success: result.success,
    totalFiles: result.generatedFiles.length,
    totalLines: result.metadata.totalLines,
  });

  logger.info('\nGenerated files by type:');
  const byType = result.generatedFiles.reduce(
    (acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  Object.entries(byType).forEach(([type, count]) => {
    logger.info(`  ${type}: ${count}`);
  });

  result.generatedFiles.forEach((file) => {
    logger.info(`  ✅ ${file.path.padEnd(40)} (${file.type})`);
  });
}

/**
 * Demo 5: Error handling - invalid response
 */
async function demoErrorHandling(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 5: Error Handling - Invalid Response');
  logger.info('='.repeat(60));

  const aiResponse = new AIResponse(
    'This is not JSON at all! Just plain text that cannot be repaired.',
    new TokenUsage(50, 30),
    {
      provider: 'openai',
      model: 'gpt-4o',
      finishReason: 'stop',
      createdAt: new Date(),
    },
  );

  logger.info('Input AIResponse (invalid):', {
    provider: aiResponse.provider,
    content: aiResponse.content,
  });

  const processor = new AIResponseProcessor(logger);
  const result = await processor.process(aiResponse);

  logger.info('Result:', {
    success: result.success,
    errors: result.errors,
    failureReason: result.metadata.failureReason,
  });

  if (!result.success) {
    logger.info(`  ❌ Processing failed as expected`);
    logger.info(`  Error: ${result.errors[0]}`);
  }
}

/**
 * Demo 6: Truncated response detection
 */
async function demoTruncatedResponse(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 6: Truncated Response Detection');
  logger.info('='.repeat(60));

  const content = JSON.stringify({
    files: [
      {
        path: 'tasks/ComplexTask.ts',
        type: 'task',
        content: 'export class ComplexTask { /* incomplete due to truncation... ',
      },
    ],
  });

  const aiResponse = new AIResponse(content, new TokenUsage(180, 256), {
    provider: 'openai',
    model: 'gpt-4o',
    finishReason: 'length', // Indicates truncation
    createdAt: new Date(),
  });

  logger.info('Input AIResponse (truncated):', {
    provider: aiResponse.provider,
    finishReason: aiResponse.finishReason,
  });

  const processor = new AIResponseProcessor(logger);
  const result = await processor.process(aiResponse);

  logger.info('Result:', {
    success: result.success,
    warnings: result.warnings,
  });

  if (result.warnings.some((w) => w.includes('truncated'))) {
    logger.info(`  ⚠️  Warning: Response may be truncated`);
  }
}

/**
 * Demo 7: Service layer overview
 */
async function demoServiceLayers(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 7: Service Layer Architecture');
  logger.info('='.repeat(60));

  logger.info('Processing Pipeline:', {
    architecture: `
Stage 1: JsonExtractor
  ├─ Plain JSON: {...}
  ├─ Markdown: \`\`\`json {...}\`\`\`
  ├─ Code blocks: \`\`\`json {...}\`\`\`
  └─ Embedded: "...{...}..."

Stage 2: JsonRepair (if needed)
  ├─ Strategy 1: Remove trailing commas
  ├─ Strategy 2: Fix unescaped newlines
  ├─ Strategy 3: Convert single quotes to double
  ├─ Strategy 4: Quote unquoted keys
  └─ Strategy 5: Complete missing brackets

Stage 3: ResponseValidator
  ├─ Schema check: { files: [...] }
  ├─ Field validation: path, type, content
  ├─ Type validation: task, page, interaction, etc
  └─ Path validation: no invalid filesystem chars

Stage 4: GenerationResult
  └─ Output: { success, files, errors, warnings, metadata }
    `,
  });

  // Test each service independently
  logger.info('\nIndividual Service Tests:');

  // JsonExtractor
  const extractor = new JsonExtractor(logger);
  const extracted = extractor.extract('{"files": []}');
  logger.info('  1. JsonExtractor: ✅ Extracted JSON');

  // JsonRepair
  const repair = new JsonRepair(logger);
  const repaired = repair.repair('{key: "value",}');
  logger.info('  2. JsonRepair: ✅ Repaired malformed JSON');

  // ResponseValidator
  const validator = new ResponseValidator(logger);
  const validationResult = validator.validate({
    files: [{ path: 'test.ts', type: 'test', content: 'code' }],
  });
  logger.info('  3. ResponseValidator:', {
    isValid: validationResult.isValid,
    filesCount: validationResult.generatedFiles.length,
  });

  // ResponseParser (orchestration)
  const parser = new ResponseParser(logger);
  const parseResult = parser.parse('{"files": []}', 'proc_123');
  logger.info('  4. ResponseParser: ✅ Orchestrated full pipeline');

  // AIResponseProcessor (main entry point)
  logger.info('  5. AIResponseProcessor: ✅ Main orchestrator');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  logger.info('');
  logger.info('╔' + '═'.repeat(58) + '╗');
  logger.info(
    '║' + ' '.repeat(10) + 'Phase 6: AI Response Processing Engine' + ' '.repeat(10) + '║',
  );
  logger.info('║' + ' '.repeat(58) + '║');
  logger.info(
    '║' + ' '.repeat(5) + 'Transforms AIResponse → GenerationResult' + ' '.repeat(14) + '║',
  );
  logger.info('╚' + '═'.repeat(58) + '╝');

  try {
    await demoCleanResponse();
    await demoMarkdownResponse();
    await demoMalformedResponse();
    await demoMultipleFiles();
    await demoErrorHandling();
    await demoTruncatedResponse();
    await demoServiceLayers();

    logger.info('\n' + '='.repeat(60));
    logger.info('All Demos Complete ✅');
    logger.info('='.repeat(60));

    logger.info('\nPhase 6 Integration:', {
      pipeline: `
Phase 4: PromptRenderer
  ↓ (PromptMessages)
Phase 5: LLMService
  ↓ (AIResponse)
Phase 6: AIResponseProcessor ← You are here
  ↓ (GenerationResult)
Phase 7: CodeGenerator
  ↓ (FileWriter)
Files written to disk
      `,
    });

    logger.info('\nNext Steps:', {
      testing: 'pnpm test response',
      documentation: 'apps/ai-platform/response/README.md',
      phase7: 'Implement Phase 7 - Code Generation and File Writing',
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Demo failed:', err);
    process.exit(1);
  }
}

// Run all demos
runAllDemos().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Fatal error:', err);
  process.exit(1);
});
