/**
 * Phase 7 Demo: Validation & Quality Engine
 *
 * This demo shows how the Validation & Quality Engine validates GeneratedFile objects
 * (from Phase 6 output) and produces ValidatedGeneration results ready for Phase 8 (Filesystem).
 *
 * The processing pipeline:
 *   GenerationResult → ValidationEngine → ValidatedGeneration
 *                              ↓
 *            [ValidationPipeline + Detectors]
 *                              ↓
 *                    approvedFiles + rejectedFiles
 *
 * Run with:
 *   pnpm exec ts-node apps/ai-platform/phase7-demo.ts
 */

import {
  ValidationEngine,
  ValidationPipeline,
  ValidationSeverity,
  FilePathValidator,
  NamingConventionValidator,
  ImportValidator,
  ScreenplayValidator,
  TypeScriptValidator,
  CodeQualityValidator,
  DuplicateDetector,
  ProjectConflictDetector,
} from './validation/index.js';
import { createLogger } from './logger/index.js';

const logger = createLogger('Phase7Demo');

/**
 * Helper: Create mock GeneratedFile
 */
function createGeneratedFile(
  path: string,
  type: string,
  content: string,
): {
  path: string;
  type: string;
  content: string;
  description?: string;
} {
  return {
    path,
    type,
    content,
    description: `Generated ${type} at ${path}`,
  };
}

/**
 * Helper: Create mock GenerationResult
 */
function createGenerationResult(files: any[]) {
  return {
    success: true,
    generatedFiles: files,
    errors: [],
    warnings: [],
    metadata: {
      processingTimeMs: 150,
      llmProvider: 'openai',
      model: 'gpt-4o',
    },
  };
}

/**
 * Demo 1: Clean valid files (all approved)
 */
async function demoCleanValidation(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 1: Clean Valid Files (All Approved)');
  logger.info('='.repeat(60));

  const files = [
    createGeneratedFile(
      'tasks/LoginTask.ts',
      'task',
      `import { Task } from '@automation/tasks/Task.js';
import { Actor } from '@automation/actors/Actor.js';

export class LoginTask extends Task {
  constructor(private username: string, private password: string) {
    super();
  }

  perform(actor: Actor): Promise<void> {
    return actor.attemptsTo(
      // authentication steps
    );
  }
}`,
    ),
    createGeneratedFile(
      'pages/LoginPage.ts',
      'page',
      `export class LoginPage {
  static readonly usernameField = 'input[name="username"]';
  static readonly passwordField = 'input[name="password"]';
  static readonly loginButton = 'button:has-text("Login")';
}`,
    ),
    createGeneratedFile(
      'questions/IsLoggedInQuestion.ts',
      'question',
      `import { Question } from '@automation/questions/Question.js';
import { Actor } from '@automation/actors/Actor.js';

export class IsLoggedInQuestion extends Question {
  answeredBy(actor: Actor): Promise<boolean> {
    // Check if logged in
    return actor.asks(this);
  }
}`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
    types: generationResult.generatedFiles.map((f) => f.type),
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(),
    existingTasks: new Set(),
    existingQuestions: new Set(),
    existingPages: new Set(),
    forbiddenPaths: new Set(['node_modules', 'dist']),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    readyToWrite: result.readyToWrite,
    qualityScore: result.qualityScore,
    approvedCount: result.approvedFiles.length,
    rejectedCount: result.rejectedFiles.length,
    totalViolations: result.violations.length,
  });

  logger.info('\n✅ Approved Files:');
  result.approvedFiles.forEach((file) => {
    logger.info(`  ${file.path.padEnd(40)} Quality: ${100}`);
  });

  if (result.violations.length > 0) {
    logger.info('\nViolations:', result.violations.length);
  }
}

/**
 * Demo 2: Files with naming issues (warnings)
 */
async function demoNamingIssues(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 2: Files with Naming Issues (Warnings)');
  logger.info('='.repeat(60));

  const files = [
    createGeneratedFile(
      'tasks/login.ts', // ❌ Should be LoginTask.ts (missing suffix and case)
      'task',
      `export class login {
  perform() { }
}`,
    ),
    createGeneratedFile(
      'questions/isLoggedIn.ts', // ❌ Should be IsLoggedInQuestion.ts
      'question',
      `export class isLoggedIn {
  answeredBy() { }
}`,
    ),
    createGeneratedFile(
      'pages/l.ts', // ❌ Too short
      'page',
      `export class l { }`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
    issues: '❌ Missing suffixes, not PascalCase, too short',
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(),
    existingTasks: new Set(),
    existingQuestions: new Set(),
    existingPages: new Set(),
    forbiddenPaths: new Set(),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    readyToWrite: result.readyToWrite,
    qualityScore: result.qualityScore,
    approvedCount: result.approvedFiles.length,
    rejectedCount: result.rejectedFiles.length,
    violations: result.violations.filter((v) => v.severity === ValidationSeverity.ERROR).length,
    warnings: result.violations.filter((v) => v.severity === ValidationSeverity.WARNING).length,
  });

  logger.info('\n⚠️  Violations:');
  result.violations.forEach((violation) => {
    const icon = violation.severity === ValidationSeverity.ERROR ? '❌' : '⚠️ ';
    logger.info(`  ${icon} [${violation.category}] ${violation.message}`);
    if (violation.affectedFile) {
      logger.info(`     File: ${violation.affectedFile}`);
    }
  });
}

/**
 * Demo 3: Duplicate detection (errors)
 */
async function demoDuplicateDetection(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 3: Duplicate Detection (Errors)');
  logger.info('='.repeat(60));

  const files = [
    createGeneratedFile(
      'tasks/CreateUserTask.ts',
      'task',
      `export class CreateUserTask {
  perform() { }
}`,
    ),
    createGeneratedFile(
      'tasks/CreateUserTask.ts', // ❌ Duplicate!
      'task',
      `export class CreateUserTask {
  perform() { }
}`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
    issue: '❌ Duplicate file path',
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(),
    existingTasks: new Set(['CreateUserTask']), // Already exists!
    existingQuestions: new Set(),
    existingPages: new Set(),
    forbiddenPaths: new Set(),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    readyToWrite: result.readyToWrite,
    qualityScore: result.qualityScore,
    rejectedCount: result.rejectedFiles.length,
    violations: result.violations.filter((v) => v.severity === ValidationSeverity.ERROR).length,
  });

  logger.info('\n❌ Rejected Files:');
  result.rejectedFiles.forEach((file) => {
    logger.info(`  ${file.path}`);
  });

  logger.info('\n❌ Errors:');
  result.violations
    .filter((v) => v.severity === ValidationSeverity.ERROR)
    .forEach((violation) => {
      logger.info(`  ❌ [${violation.category}] ${violation.message}`);
    });
}

/**
 * Demo 4: Screenplay pattern violations
 */
async function demoScreenplayViolations(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 4: Screenplay Pattern Violations');
  logger.info('='.repeat(60));

  const files = [
    createGeneratedFile(
      'tasks/BuyItemTask.ts',
      'task',
      `import { page } from '@playwright/test';

export class BuyItemTask {
  async perform() {
    // ❌ Direct page manipulation - forbidden in Task!
    page.click('button[data-testid="buy"]');
    await page.waitForNavigation();
  }
}`,
    ),
    createGeneratedFile(
      'questions/PriceQuestion.ts',
      'question',
      `export class PriceQuestion {
  // ❌ Missing answeredBy method
  getPrice() {
    return '99.99';
  }
}`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
    issues: ['❌ Task uses forbidden page.click()', '❌ Question missing answeredBy method'],
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(),
    existingTasks: new Set(),
    existingQuestions: new Set(),
    existingPages: new Set(),
    forbiddenPaths: new Set(),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    readyToWrite: result.readyToWrite,
    qualityScore: result.qualityScore,
    rejectedCount: result.rejectedFiles.length,
    errors: result.violations.filter((v) => v.severity === ValidationSeverity.ERROR).length,
  });

  logger.info('\n❌ Screenplay Violations:');
  result.violations
    .filter((v) => v.category === 'screenplay')
    .forEach((violation) => {
      logger.info(`  ❌ ${violation.message}`);
      if (violation.suggestion) {
        logger.info(`     💡 Suggestion: ${violation.suggestion}`);
      }
    });
}

/**
 * Demo 5: TypeScript syntax errors
 */
async function demoTypeScriptErrors(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 5: TypeScript Syntax Errors');
  logger.info('='.repeat(60));

  const files = [
    createGeneratedFile(
      'interactions/ClickButton.ts',
      'interaction',
      `export class ClickButton {
  execute() {
    // ❌ Unmatched braces
    console.log("Hello
  }
}
`,
    ),
    createGeneratedFile(
      'pages/HomePage.ts',
      'page',
      `export class HomePage {
  constructor() {
    // ❌ Unmatched parentheses
    this.init(;
  }
}`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
    issues: ['❌ Unmatched braces', '❌ Unmatched parentheses'],
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(),
    existingTasks: new Set(),
    existingQuestions: new Set(),
    existingPages: new Set(),
    forbiddenPaths: new Set(),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    readyToWrite: result.readyToWrite,
    qualityScore: result.qualityScore,
    rejectedCount: result.rejectedFiles.length,
    typeScriptErrors: result.violations.filter((v) => v.category === 'typescript').length,
  });

  logger.info('\n❌ TypeScript Errors:');
  result.violations
    .filter((v) => v.category === 'typescript')
    .forEach((violation) => {
      logger.info(`  ❌ ${violation.message}`);
    });
}

/**
 * Demo 6: Mixed validation results
 */
async function demoMixedResults(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 6: Mixed Validation Results');
  logger.info('='.repeat(60));

  const files = [
    // ✅ Clean file
    createGeneratedFile(
      'tasks/LoginTask.ts',
      'task',
      `import { Task } from '@automation/tasks/Task.js';
import { Actor } from '@automation/actors/Actor.js';

export class LoginTask extends Task {
  perform(actor: Actor): Promise<void> {
    return Promise.resolve();
  }
}`,
    ),
    // ⚠️  Warning: Naming issue
    createGeneratedFile(
      'questions/login.ts', // Should be LoginQuestion.ts
      'question',
      `import { Question } from '@automation/questions/Question.js';

export class login extends Question {
  answeredBy() { }
}`,
    ),
    // ❌ Error: File exists
    createGeneratedFile('pages/LoginPage.ts', 'page', `export class LoginPage { }`),
    // ✅ Clean file
    createGeneratedFile(
      'interactions/EnterCredentials.ts',
      'interaction',
      `import { Interaction } from '@automation/interactions/Interaction.js';

export class EnterCredentials extends Interaction {
  perform() { }
}`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(['pages/LoginPage.ts']), // This file exists!
    existingTasks: new Set(),
    existingQuestions: new Set(),
    existingPages: new Set(['LoginPage']),
    forbiddenPaths: new Set(),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    readyToWrite: result.readyToWrite,
    qualityScore: `${result.qualityScore}/100`,
    approvedCount: result.approvedFiles.length,
    rejectedCount: result.rejectedFiles.length,
  });

  logger.info('\n✅ Approved Files:');
  result.approvedFiles.forEach((file) => {
    const violations = result.violations.filter((v) => v.affectedFile === file.path);
    const severity = violations.length > 0 ? 'with warnings' : 'clean';
    logger.info(`  ${file.path.padEnd(40)} ${severity}`);
  });

  logger.info('\n❌ Rejected Files:');
  result.rejectedFiles.forEach((file) => {
    const violations = result.violations.filter((v) => v.affectedFile === file.path);
    logger.info(`  ${file.path.padEnd(40)} (${violations.length} errors)`);
  });

  logger.info('\nViolation Summary:');
  const bySeverity = result.violations.reduce(
    (acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  logger.info(`  ❌ Errors: ${bySeverity[ValidationSeverity.ERROR] || 0}`);
  logger.info(`  ⚠️  Warnings: ${bySeverity[ValidationSeverity.WARNING] || 0}`);
  logger.info(`  ℹ️  Info: ${bySeverity[ValidationSeverity.INFO] || 0}`);
}

/**
 * Demo 7: Quality score calculation
 */
async function demoQualityScoring(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 7: Quality Score Calculation');
  logger.info('='.repeat(60));

  const files = [
    // High quality file
    createGeneratedFile(
      'tasks/CompleteCheckoutTask.ts',
      'task',
      `import { Task } from '@automation/tasks/Task.js';
import { Actor } from '@automation/actors/Actor.js';
import { FillFormInteraction } from '@automation/interactions/FillFormInteraction.js';

/**
 * Task to complete checkout flow
 * Fills payment form and confirms order
 */
export class CompleteCheckoutTask extends Task {
  constructor(private paymentInfo: PaymentInfo) {
    super();
  }

  perform(actor: Actor): Promise<void> {
    return actor.attemptsTo(
      new FillFormInteraction(this.paymentInfo),
    );
  }
}`,
    ),
    // Medium quality file
    createGeneratedFile(
      'pages/CheckoutPage.ts',
      'page',
      `// Checkout page selectors
export class CheckoutPage {
  static totalAmount = 'span[data-testid="total"]';
  static submitBtn = 'button[type="submit"]';
}`,
    ),
    // Lower quality file (long lines, no comments)
    createGeneratedFile(
      'questions/IsTotalCorrectQuestion.ts',
      'question',
      `export class IsTotalCorrectQuestion extends Question { answeredBy() { const total = page.locator('span[data-testid="total-amount-display-section"]').textContent(); return total === expectedAmount; } }`,
    ),
  ];

  const generationResult = createGenerationResult(files);

  logger.info('Input GenerationResult:', {
    filesCount: generationResult.generatedFiles.length,
    quality: 'Mixed - from high to lower quality',
  });

  const engine = new ValidationEngine();
  engine.initializeWithProjectContext({
    projectRoot: '/project',
    existingFiles: new Set(),
    existingTasks: new Set(),
    existingQuestions: new Set(),
    existingPages: new Set(),
    forbiddenPaths: new Set(),
  });

  const result = await engine.validate(generationResult);

  logger.info('Result:', {
    isValid: result.isValid,
    overallQualityScore: result.qualityScore,
    approvedCount: result.approvedFiles.length,
  });

  logger.info('\nPer-File Quality:');
  result.approvedFiles.forEach((file) => {
    const violations = result.violations.filter((v) => v.affectedFile === file.path);
    const score =
      100 -
      violations.reduce((acc, v) => {
        if (v.severity === ValidationSeverity.ERROR) return acc - 15;
        if (v.severity === ValidationSeverity.WARNING) return acc - 5;
        return acc - 1;
      }, 100);

    logger.info(`  ${file.path.padEnd(40)} Quality: ${Math.max(0, score)}/100`);
  });

  if (result.report) {
    logger.info('\nScore Breakdown:', result.report.scoreBreakdown);
  }

  logger.info('\nRecommendations:');
  (result.report?.recommendations || []).forEach((rec) => {
    logger.info(`  💡 ${rec}`);
  });
}

/**
 * Demo 8: Service layer architecture
 */
async function demoServiceLayers(): Promise<void> {
  logger.info('\n' + '='.repeat(60));
  logger.info('Demo 8: Service Layer Architecture');
  logger.info('='.repeat(60));

  logger.info('Validation Pipeline:', {
    architecture: `
ValidationEngine (Orchestrator)
  ├─ Initialize project context
  │  ├─ Existing files
  │  ├─ Existing Tasks/Questions/Pages
  │  └─ Forbidden paths
  │
  ├─ ValidationPipeline (8 validators)
  │  ├─ 1. FilePathValidator
  │  │    └─ Check extensions, folder structure, path format
  │  │
  │  ├─ 2. NamingConventionValidator
  │  │    └─ Check PascalCase, suffixes (Task, Question, Page)
  │  │
  │  ├─ 3. ImportValidator
  │  │    └─ Check duplicates, circular refs, .js extensions
  │  │
  │  ├─ 4. ScreenplayValidator
  │  │    └─ Check extends, required methods, forbidden patterns
  │  │
  │  ├─ 5. TypeScriptValidator
  │  │    └─ Check syntax, braces, parens, type annotations
  │  │
  │  ├─ 6. CodeQualityValidator
  │  │    └─ Check line length, functions, comments
  │  │
  │  └─ 7. ProjectConflictDetector (with context)
  │       └─ Check file conflicts, forbidden paths
  │
  ├─ DuplicateDetector (with context)
  │  └─ Check duplicate Tasks/Questions/Pages
  │
  └─ Report generation
     ├─ Violations by category
     ├─ Violations by severity
     ├─ Quality score calculation
     └─ Recommendations
    `,
  });

  logger.info('\nValidator Details:');
  logger.info('  • Each validator is independent');
  logger.info('  • Validators run sequentially');
  logger.info('  • One validator failure does not stop others');
  logger.info('  • Quality score: start at 100, deduct per violation');
  logger.info('    - ERROR: -15 points');
  logger.info('    - WARNING: -5 points');
  logger.info('    - INFO: -1 point');

  logger.info('\nValidation Severity Levels:');
  logger.info(`  • ${ValidationSeverity.ERROR}: Blocks approval`);
  logger.info(`  • ${ValidationSeverity.WARNING}: Allow with caution`);
  logger.info(`  • ${ValidationSeverity.INFO}: Suggestions`);

  logger.info('\nOutput: ValidatedGeneration');
  logger.info('  {');
  logger.info('    isValid: boolean,');
  logger.info('    readyToWrite: boolean,');
  logger.info('    qualityScore: 0-100,');
  logger.info('    approvedFiles: GeneratedFile[],');
  logger.info('    rejectedFiles: GeneratedFile[],');
  logger.info('    violations: ValidationRule[],');
  logger.info('    report: {');
  logger.info('      summary,');
  logger.info('      byCategory,');
  logger.info('      bySeverity,');
  logger.info('      byFile,');
  logger.info('      scoreBreakdown,');
  logger.info('      recommendations');
  logger.info('    }');
  logger.info('  }');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  logger.info('');
  logger.info('╔' + '═'.repeat(58) + '╗');
  logger.info('║' + ' '.repeat(14) + 'Phase 7: Validation & Quality Engine' + ' '.repeat(8) + '║');
  logger.info('║' + ' '.repeat(58) + '║');
  logger.info(
    '║' + ' '.repeat(4) + 'Validates GenerationResult → ValidatedGeneration' + ' '.repeat(5) + '║',
  );
  logger.info('╚' + '═'.repeat(58) + '╝');

  try {
    await demoCleanValidation();
    await demoNamingIssues();
    await demoDuplicateDetection();
    await demoScreenplayViolations();
    await demoTypeScriptErrors();
    await demoMixedResults();
    await demoQualityScoring();
    await demoServiceLayers();

    logger.info('\n' + '='.repeat(60));
    logger.info('All Demos Complete ✅');
    logger.info('='.repeat(60));

    logger.info('\nPhase 7 Integration:', {
      pipeline: `
Phase 5: LLMService
  ↓ (AIResponse)
Phase 6: AIResponseProcessor
  ↓ (GenerationResult)
Phase 7: ValidationEngine ← You are here
  ├─ ValidationPipeline
  ├─ DuplicateDetector
  ├─ ProjectConflictDetector
  └─ Quality Report
  ↓ (ValidatedGeneration)
Phase 8: FileSystemWriter
  ↓ (FileSystemWriteResult)
Phase 5: Git Workflow
  └─ PR created with changes
      `,
    });

    logger.info('\nNext Steps:', {
      testing: 'pnpm test validation',
      documentation: 'apps/ai-platform/validation/README.md',
      phase8: 'Implement Phase 8 - Filesystem Writer',
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
