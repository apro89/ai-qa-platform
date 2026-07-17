/**
 * Phase 4 Demo: Prompt Rendering Layer
 *
 * Demonstrates the complete prompt rendering pipeline:
 * - Create AIRequest (from Phase 3)
 * - Render using PromptRenderer
 * - Display results with metadata
 */

import { AIModuleFactory } from './ai/index.js';
import { PromptRenderer } from './prompts/index.js';
import type { ProjectContext } from './context/ProjectContext.js';

function createMockProjectContext(): ProjectContext {
  return {
    framework: 'Playwright',
    frameworkVersion: '1.40.0',
    typescriptVersion: '5.3.0',
    architecture: 'Screenplay Pattern',
    supportedArchitectures: ['Screenplay Pattern'],

    folderStructure: {
      pages: ['cart.page.ts', 'checkout.page.ts', 'header.page.ts', 'login.page.ts'],
      tasks: ['checkout.task.ts', 'login.task.ts', 'logout.task.ts'],
      interactions: ['click.ts', 'enter.ts', 'select.ts'],
      questions: ['is-logged-in.ts', 'order-confirmed.ts'],
      tests: ['checkout.spec.ts', 'login.spec.ts'],
    },

    pages: [
      { name: 'CartPage', path: 'pages/cart.page.ts' },
      { name: 'CheckoutPage', path: 'pages/checkout.page.ts' },
      { name: 'HeaderPage', path: 'pages/header.page.ts' },
      { name: 'LoginPage', path: 'pages/login.page.ts' },
    ],

    tasks: [
      { name: 'CheckoutTask', path: 'tasks/checkout.task.ts' },
      { name: 'LoginTask', path: 'tasks/login.task.ts' },
      { name: 'LogoutTask', path: 'tasks/logout.task.ts' },
    ],

    interactions: [
      { name: 'Click', path: 'interactions/click.ts' },
      { name: 'Enter', path: 'interactions/enter.ts' },
      { name: 'Select', path: 'interactions/select.ts' },
    ],

    questions: [
      { name: 'IsLoggedIn', path: 'questions/is-logged-in.ts' },
      { name: 'OrderConfirmed', path: 'questions/order-confirmed.ts' },
    ],

    components: [],
    fixtures: [],
    utilities: [],
    configurations: [],

    namingConventions: {
      pages: {
        pattern: '*Page.ts',
        examples: ['LoginPage', 'CartPage', 'CheckoutPage'],
        description: 'Page objects using PascalCase + "Page" suffix',
      },
      tasks: {
        pattern: '*Task.ts',
        examples: ['LoginTask', 'CheckoutTask', 'LogoutTask'],
        description: 'Tasks using PascalCase + "Task" suffix',
      },
      interactions: {
        pattern: '*.ts',
        examples: ['Click', 'Enter', 'Select', 'UploadFile'],
        description: 'Interactions using PascalCase for class names',
      },
      questions: {
        pattern: '*.ts',
        examples: ['IsLoggedIn', 'OrderConfirmed'],
        description: 'Questions using PascalCase for class names',
      },
      tests: {
        pattern: '*.spec.ts',
        examples: ['login.spec.ts', 'checkout.spec.ts'],
        description: 'Test files using kebab-case + ".spec.ts" suffix',
      },
      components: {
        pattern: '*.tsx',
        examples: ['Button.tsx', 'Modal.tsx'],
        description: 'React components using PascalCase',
      },
      files: {
        pattern: '*.ts',
        examples: ['*.ts'],
        description: 'TypeScript files',
      },
    },

    codingStyle: {
      asyncAwait: true,
      assertionLibrary: 'expect',
      locatorStyle: 'getByRole',
      importStyle: 'absolute',
      moduleSyntax: 'esm',
      typeScriptUsage: true,
      decoratorsUsed: false,
    },

    reusableObjects: [
      {
        type: 'page',
        name: 'LoginPage',
        path: 'pages/login.page.ts',
        description: 'Authentication page with login form',
        relatedObjects: ['LoginTask'],
        usageCount: 5,
      },
      {
        type: 'task',
        name: 'LoginTask',
        path: 'tasks/login.task.ts',
        description: 'Complete login workflow',
        relatedObjects: ['LoginPage', 'IsLoggedIn'],
        usageCount: 8,
      },
    ],

    commonPatterns: [
      'Use async/await for all async operations',
      'Always use @automation/* imports',
      'Separate selectors in Pages from actions in Tasks',
      'Use Questions for state verification',
    ],

    importPatterns: [
      {
        source: '@automation/pages',
        targets: ['pages/login.page.ts', 'pages/cart.page.ts'],
        frequency: 10,
        percentage: 45,
      },
      {
        source: '@automation/tasks',
        targets: ['tasks/login.task.ts', 'tasks/checkout.task.ts'],
        frequency: 8,
        percentage: 36,
      },
    ],

    topDependencies: [
      {
        name: '@playwright/test',
        version: '^1.40.0',
        scope: 'devDependencies',
        purpose: 'E2E testing',
      },
      { name: 'typescript', version: '^5.3.0', scope: 'devDependencies', purpose: 'Type safety' },
    ],

    metadata: {
      builtAt: new Date().toISOString(),
      projectRoot: '/workspace/automation',
      totalArtifacts: 14,
      totalDependencies: 8,
    },
  };
}

async function runPhase4Demo(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         Phase 4: Prompt Rendering Layer - Demo');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // Step 1: Create AIRequest using Phase 3
  console.log('Step 1: Creating AIRequest (Phase 3)...');
  console.log('─────────────────────────────────────────');

  const aiRequestBuilder = AIModuleFactory.createRequestBuilder();
  const projectContext = createMockProjectContext();

  const aiRequest = await aiRequestBuilder.build({
    projectContext,
    userRequest: 'Create Playwright tests for a login flow with email validation',
    templateType: 'GenerateAutomation',
  });

  console.log('✓ AIRequest created');
  console.log(`  Template Type: ${aiRequest.templateType}`);
  console.log(`  Request ID: ${aiRequest.requestId}`);
  console.log(`  Framework: ${aiRequest.projectContext.framework}`);
  console.log('');

  // Step 2: Initialize PromptRenderer
  console.log('Step 2: Initializing PromptRenderer...');
  console.log('─────────────────────────────────────────');

  const renderer = new PromptRenderer();
  const availableTemplates = renderer.getAvailableTemplates();

  console.log('✓ PromptRenderer initialized');
  console.log(`  Available Templates (${availableTemplates.length}):`);
  availableTemplates.forEach((template, i) => {
    console.log(`    ${i + 1}. ${template}`);
  });
  console.log('');

  // Step 3: Render prompt
  console.log('Step 3: Rendering Prompt...');
  console.log('─────────────────────────────────────────');

  const startTime = Date.now();
  const promptMessages = await renderer.render(aiRequest);
  const renderTime = Date.now() - startTime;

  console.log('✓ Prompt rendered successfully');
  console.log(`  Rendering Time: ${renderTime}ms`);
  console.log('');

  // Step 4: Display metadata
  console.log('Step 4: Rendering Metadata');
  console.log('─────────────────────────────────────────');

  const metadata = promptMessages.metadata;
  console.log(`Template: ${metadata.template}`);
  console.log(`AI Request ID: ${metadata.aiRequestId}`);
  console.log(`Framework: ${metadata.framework}`);
  console.log(`Architecture: ${metadata.architecture}`);
  console.log(`Environment: ${metadata.environment}`);
  console.log('');

  console.log('Token Breakdown:');
  console.log(`  System Prompt: ${metadata.tokens.systemPromptTokens} tokens`);
  console.log(`  User Prompt: ${metadata.tokens.userPromptTokens} tokens`);
  console.log(`  Total: ${metadata.tokens.totalTokens} tokens`);
  console.log('');

  console.log('Validation:');
  console.log(`  Passed: ${metadata.validation.passed}`);
  console.log(`  Quality Score: ${metadata.validation.qualityScore}/100`);
  console.log(`  Warnings: ${metadata.validation.warnings.length}`);
  if (metadata.validation.warnings.length > 0) {
    metadata.validation.warnings.slice(0, 3).forEach((warning) => {
      console.log(`    • ${warning}`);
    });
  }
  console.log('');

  // Step 5: Display prompts (truncated)
  console.log('Step 5: Generated Prompts (Preview)');
  console.log('─────────────────────────────────────────');

  const systemPreview = promptMessages.systemPrompt.substring(0, 300);
  const userPreview = promptMessages.userPrompt.substring(0, 300);

  console.log('System Prompt (first 300 chars):');
  console.log(systemPreview);
  console.log(`... [${promptMessages.systemPrompt.length - 300} more chars]`);
  console.log('');

  console.log('User Prompt (first 300 chars):');
  console.log(userPreview);
  console.log(`... [${promptMessages.userPrompt.length - 300} more chars]`);
  console.log('');

  // Step 6: Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    Phase 4 Demo Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✓ AIRequest created and validated`);
  console.log(`✓ PromptRenderer initialized with ${availableTemplates.length} templates`);
  console.log(`✓ Prompt rendered in ${renderTime}ms`);
  console.log(`✓ ${metadata.tokens.totalTokens} tokens generated`);
  console.log(`✓ Quality score: ${metadata.validation.qualityScore}/100`);
  console.log('');
  console.log('Phase 4 (Prompt Rendering) is working correctly! ✓');
  console.log('');
}

// Run demo
runPhase4Demo().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
