import type { PackageDependency } from '../models/project-structure.js';
import type { DependencyInfo } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('DependencyMapper');

/**
 * DependencyMapper
 *
 * Maps package dependencies to their purpose based on:
 * - Package names
 * - Version information
 * - Known library categorization
 */
export class DependencyMapper {
  private readonly purposeMap: Record<string, string> = {
    '@playwright/test': 'Browser automation framework',
    playwright: 'Playwright library',
    typescript: 'TypeScript compiler and type checking',
    '@types/node': 'Node.js type definitions',
    'ts-node': 'TypeScript execution for Node.js',
    eslint: 'JavaScript linter',
    prettier: 'Code formatter',
    jest: 'Testing framework',
    mocha: 'Testing framework',
    chai: 'Assertion library',
    axios: 'HTTP client',
    express: 'Web framework',
    dotenv: 'Environment variable loader',
    '@openai/sdk': 'OpenAI SDK',
  };

  public mapDependencies(dependencies: PackageDependency[]): DependencyInfo[] {
    logger.debug('Mapping dependencies', { total: dependencies.length });

    const mapped = dependencies
      .filter((dep) => dep.scope === 'dependencies' || dep.scope === 'devDependencies')
      .map((dep) => ({
        name: dep.name,
        version: dep.version,
        scope: dep.scope,
        purpose: this.determinePurpose(dep.name),
      }))
      .sort((a, b) => {
        const priorityA = this.getPriority(a.name);
        const priorityB = this.getPriority(b.name);
        return priorityB - priorityA;
      })
      .slice(0, 30);

    logger.info('Dependency mapping completed', {
      total: dependencies.length,
      mapped: mapped.length,
      withPurpose: mapped.filter((d) => d.purpose).length,
    });

    logger.trace('Top dependencies', {
      deps: mapped.slice(0, 5).map((d) => ({ name: d.name, purpose: d.purpose })),
    });

    return mapped;
  }

  public getFrameworkDependencies(dependencies: DependencyInfo[]): DependencyInfo[] {
    logger.debug('Extracting framework dependencies');

    const frameworkDeps = dependencies.filter((dep) => {
      const isPlaywright = dep.name.includes('playwright');
      const isTestRunner = ['jest', 'mocha', 'vitest'].some((t) => dep.name.includes(t));
      const isTypeScript = dep.name === 'typescript' || dep.name.startsWith('@types/');
      return isPlaywright || isTestRunner || isTypeScript;
    });

    logger.trace('Framework dependencies found', { count: frameworkDeps.length });
    return frameworkDeps;
  }

  public getToolDependencies(dependencies: DependencyInfo[]): DependencyInfo[] {
    logger.debug('Extracting tool dependencies');

    const toolDeps = dependencies.filter((dep) => {
      const isLinter = dep.name.includes('eslint') || dep.name.includes('prettier');
      const isBuild =
        dep.name.includes('webpack') || dep.name.includes('vite') || dep.name.includes('rollup');
      const isNodeTool = ['ts-node', 'tsx', 'tsc'].some((t) => dep.name.includes(t));
      return isLinter || isBuild || isNodeTool;
    });

    logger.trace('Tool dependencies found', { count: toolDeps.length });
    return toolDeps;
  }

  public getQADependencies(dependencies: DependencyInfo[]): DependencyInfo[] {
    logger.debug('Extracting QA dependencies');

    const qaDeps = dependencies.filter((dep) => {
      const isPlaywright = dep.name.includes('playwright');
      const isTestRunner = ['jest', 'mocha', 'vitest'].some((t) => dep.name.includes(t));
      const isAssertion = ['chai', 'expect'].some((t) => dep.name.includes(t));
      return isPlaywright || isTestRunner || isAssertion;
    });

    logger.trace('QA dependencies found', { count: qaDeps.length });
    return qaDeps;
  }

  private determinePurpose(packageName: string): string | null {
    const lower = packageName.toLowerCase();

    for (const [pkg, purpose] of Object.entries(this.purposeMap)) {
      if (lower === pkg.toLowerCase() || lower.includes(pkg.toLowerCase().replace('@', ''))) {
        return purpose;
      }
    }

    // Guess by package name pattern
    if (lower.includes('playwright')) return 'Browser automation';
    if (lower.includes('test')) return 'Testing framework';
    if (lower.includes('lint') || lower.includes('eslint')) return 'Code linting';
    if (lower.includes('format') || lower.includes('prettier')) return 'Code formatting';
    if (lower.includes('typescript') || lower.startsWith('@types/')) return 'Type definitions';
    if (lower.includes('assert')) return 'Assertion library';

    return null;
  }

  private getPriority(packageName: string): number {
    const criticalPackages = [
      '@playwright/test',
      'playwright',
      'typescript',
      'jest',
      'mocha',
      'eslint',
    ];

    if (criticalPackages.includes(packageName)) {
      return 100;
    }

    if (packageName.includes('playwright') || packageName.startsWith('@types/')) {
      return 50;
    }

    return 1;
  }
}
