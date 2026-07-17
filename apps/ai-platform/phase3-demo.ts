/**
 * Phase 3 Demo: AI Request Builder
 *
 * This file demonstrates the AIRequestBuilder in action.
 * It shows how to build a provider-agnostic AIRequest that can later
 * be sent to any LLM provider (OpenAI, Claude, Gemini, etc.)
 *
 * Run with:
 * pnpm phase3:demo
 */

import { AIModuleFactory } from './ai/ai-module-factory.js';
import { LogLevel } from './logger/LogLevel.js';
import type { ProjectContext } from './context/ProjectContext.js';
import type { SystemInstruction } from './ai/AIRequest.js';

/**
 * Mock ProjectContext for demonstration
 * In production, this would come from Phase 1: ProjectIntelligenceService
 */
function createMockProjectContext(): ProjectContext {
  return {
    // Framework and architecture
    framework: 'Playwright',
    frameworkVersion: '1.40.0',
    typescriptVersion: '5.3.0',
    architecture: 'Screenplay Pattern',
    supportedArchitectures: ['Screenplay Pattern'],

    // Folder structure
    folderStructure: {
      pages: ['cart.page.ts', 'checkout.page.ts', 'header.page.ts', 'login.page.ts'],
      tasks: ['checkout.task.ts', 'login.task.ts', 'logout.task.ts'],
      interactions: ['click.ts', 'enter.ts', 'select.ts'],
      questions: ['is-logged-in.ts', 'order-confirmed.ts'],
      tests: ['checkout.spec.ts', 'login.spec.ts'],
    },

    // Artifacts
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

    // Naming conventions
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

    // Coding style
    codingStyle: {
      asyncAwait: true,
      assertionLibrary: 'expect',
      locatorStyle: 'getByRole',
      importStyle: 'absolute',
      moduleSyntax: 'esm',
      typeScriptUsage: true,
      decoratorsUsed: false,
    },

    // Reusable patterns and imports
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

    // Metadata
    metadata: {
      builtAt: new Date().toISOString(),
      projectRoot: '/workspace/automation',
      totalArtifacts: 14,
      totalDependencies: 8,
    },
  };
}

/**
 * Demonstration function
 */
async function demonstratePhase3(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 3: AI REQUEST BUILDER DEMONSTRATION');
  console.log('='.repeat(80) + '\n');

  // Create the builder
  const builder = AIModuleFactory.createRequestBuilder(LogLevel.INFO);

  // Create a mock project context
  const projectContext = createMockProjectContext();

  console.log('📋 Project Context:');
  console.log(`   Framework: ${projectContext.framework}`);
  console.log(`   Architecture: ${projectContext.architecture}`);
  console.log(`   Pages: ${projectContext.pages.length}`);
  console.log(`   Tasks: ${projectContext.tasks.length}`);
  console.log(`   Questions: ${projectContext.questions.length}\n`);

  // Build AI Request #1: Generate Login Automation
  console.log('🔨 Building AI Request #1: "Generate Login automation"');
  console.log('-'.repeat(80));

  try {
    const request1 = await builder.build({
      projectContext,
      userRequest: 'Generate Login automation with form validation',
      templateType: 'GenerateAutomation',
    });

    console.log('✅ Request built successfully!\n');
    console.log('📦 AIRequest Structure:');
    console.log(`   Request ID: ${request1.requestId}`);
    console.log(`   Template: ${request1.templateType}`);
    console.log(`   Objective: ${request1.objective.substring(0, 60)}...`);
    console.log(`   System Instructions: ${request1.systemInstructions.length}`);
    console.log(`   Selected Pages: ${request1.reusablePatterns.pages?.length || 0}`);
    console.log(`   Selected Tasks: ${request1.reusablePatterns.tasks?.length || 0}`);
    console.log(`   Estimated Tokens: ${request1.metadata.contextMetadata.estimatedTokenCount}`);
    console.log(
      `   Compression Ratio: ${request1.metadata.contextMetadata.compressionRatio.toFixed(2)}x`,
    );
    console.log(`   Created At: ${new Date(request1.metadata.createdAt).toLocaleString()}\n`);

    console.log('📝 System Instructions:');
    request1.systemInstructions.forEach((instruction: SystemInstruction, idx: number) => {
      console.log(
        `   [${idx + 1}] ${instruction.category} (${instruction.priority}): ${instruction.content.substring(0, 50)}...`,
      );
    });
    console.log();

    console.log('🎯 Reusable Patterns Available:');
    if (request1.reusablePatterns.pages && request1.reusablePatterns.pages.length > 0) {
      console.log(`   Pages: ${request1.reusablePatterns.pages.map((p) => p.name).join(', ')}`);
    }
    if (request1.reusablePatterns.tasks && request1.reusablePatterns.tasks.length > 0) {
      console.log(`   Tasks: ${request1.reusablePatterns.tasks.map((t) => t.name).join(', ')}`);
    }
    console.log();

    console.log('🎬 Expected Output Format:');
    console.log(`   Format: ${request1.expectedOutput.format}`);
    console.log(
      `   Constraints: ${request1.expectedOutput.constraints?.slice(0, 2).join(', ')}...`,
    );
    console.log();
  } catch (error) {
    console.error('❌ Error building request:', error);
    process.exit(1);
  }

  // Build AI Request #2: Generate Task
  console.log('🔨 Building AI Request #2: "Generate checkout task with payment"');
  console.log('-'.repeat(80));

  try {
    const request2 = await builder.build({
      projectContext,
      userRequest: 'Generate checkout task with payment integration',
      templateType: 'GenerateTask',
    });

    console.log('✅ Request built successfully!\n');
    console.log('📦 AIRequest Structure:');
    console.log(`   Request ID: ${request2.requestId}`);
    console.log(`   Template: ${request2.templateType}`);
    console.log(`   Objective: ${request2.objective}`);
    console.log(`   Selected Pages: ${request2.reusablePatterns.pages?.length || 0}`);
    console.log(`   Selected Tasks: ${request2.reusablePatterns.tasks?.length || 0}`);
    console.log(`   Estimated Tokens: ${request2.metadata.contextMetadata.estimatedTokenCount}`);
    console.log(
      `   Compression Ratio: ${request2.metadata.contextMetadata.compressionRatio.toFixed(2)}x\n`,
    );

    if (request2.reusablePatterns.pages && request2.reusablePatterns.pages.length > 0) {
      console.log(
        `   Selected Pages: ${request2.reusablePatterns.pages.map((p) => p.name).join(', ')}`,
      );
    }
    console.log();
  } catch (error) {
    console.error('❌ Error building request:', error);
    process.exit(1);
  }

  // Summary
  console.log('='.repeat(80));
  console.log('✨ PHASE 3 SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('✅ What Phase 3 Accomplished:');
  console.log('   1. ✓ Validated ProjectContext completeness');
  console.log('   2. ✓ Selected only relevant project information');
  console.log('   3. ✓ Compressed context to manageable size');
  console.log('   4. ✓ Built comprehensive system instructions');
  console.log('   5. ✓ Estimated token consumption');
  console.log('   6. ✓ Generated provider-agnostic AIRequest\n');

  console.log('🎯 Key Properties of AIRequest:');
  console.log('   • No provider-specific logic (works with OpenAI, Claude, Gemini, etc.)');
  console.log('   • Complete context for code generation');
  console.log('   • System instructions enforcing project standards');
  console.log('   • Token estimates for cost planning');
  console.log('   • Clear expected output format and constraints\n');

  console.log('🚀 Next Phase (Phase 4):');
  console.log('   • Create provider adapters (OpenAI, Claude, etc.)');
  console.log('   • Convert AIRequest to provider-specific format');
  console.log('   • Call LLM and handle responses');
  console.log('   • No changes needed to Phase 3!\n');

  console.log('📖 Architecture Principles:');
  console.log('   ✓ Clean Architecture - domain-centric');
  console.log('   ✓ SOLID principles - single responsibility');
  console.log('   ✓ Provider-agnostic - swap providers easily');
  console.log('   ✓ Fully testable - no external dependencies');
  console.log('   ✓ Well-logged - observability throughout\n');

  console.log('='.repeat(80) + '\n');
}

// Run the demonstration
demonstratePhase3().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
