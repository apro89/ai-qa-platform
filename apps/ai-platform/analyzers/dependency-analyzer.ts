import type {
  PackageDependency,
  PackageInfo,
  PlaywrightConfigInfo,
} from '../models/project-structure.js';
import type { PackageJsonModel, ScannedProject } from '../models/scan-models.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('DependencyAnalyzer');

export interface DependencyAnalysisResult {
  dependencies: PackageDependency[];
  packageInfo: PackageInfo | null;
  playwrightConfig: PlaywrightConfigInfo | null;
  playwrightVersion: string | null;
  typescriptVersion: string | null;
}

export class DependencyAnalyzer {
  public analyze(project: ScannedProject): DependencyAnalysisResult {
    logger.debug('Analyzing project dependencies');

    const packageFile = project.files.find((file) => file.path === 'package.json');
    const packageJson = this.parsePackageJson(packageFile?.content);

    if (packageJson) {
      logger.debug('Package.json found', {
        name: packageJson.name,
        version: packageJson.version,
      });
    } else {
      logger.warn('Package.json not found in project');
    }

    const dependencies = this.extractDependencies(packageJson);
    logger.debug('Dependencies extracted', {
      total: dependencies.length,
      prod: dependencies.filter((d) => d.scope === 'dependencies').length,
      dev: dependencies.filter((d) => d.scope === 'devDependencies').length,
    });

    const playwrightConfig = this.detectPlaywrightConfig(project);
    if (playwrightConfig) {
      logger.info('Playwright configuration detected', {
        path: playwrightConfig.path,
        format: playwrightConfig.format,
      });
    }

    const playwrightVersion = this.findVersion(dependencies, '@playwright/test', 'playwright');
    const typescriptVersion = this.findVersion(dependencies, 'typescript');

    logger.info('Dependency analysis completed', {
      playwrightVersion,
      typescriptVersion,
      hasConfig: !!playwrightConfig,
    });

    return {
      dependencies,
      packageInfo: packageJson
        ? {
            name: packageJson.name ?? null,
            version: packageJson.version ?? null,
            private: typeof packageJson.private === 'boolean' ? packageJson.private : null,
          }
        : null,
      playwrightConfig,
      playwrightVersion,
      typescriptVersion,
    };
  }

  private parsePackageJson(content: string | undefined): PackageJsonModel | null {
    if (!content) {
      return null;
    }

    try {
      return JSON.parse(content) as PackageJsonModel;
    } catch {
      return null;
    }
  }

  private extractDependencies(packageJson: PackageJsonModel | null): PackageDependency[] {
    if (!packageJson) {
      return [];
    }

    const dependencies: PackageDependency[] = [];

    for (const [name, version] of Object.entries(packageJson.dependencies ?? {})) {
      dependencies.push({ name, version, scope: 'dependencies' });
    }

    for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
      dependencies.push({ name, version, scope: 'devDependencies' });
    }

    return dependencies.sort((left, right) => left.name.localeCompare(right.name));
  }

  private detectPlaywrightConfig(project: ScannedProject): PlaywrightConfigInfo | null {
    const configFile = project.files.find((file) =>
      /^playwright\.config\.(ts|js|mjs|cjs)$/.test(file.path),
    );
    if (!configFile) {
      return null;
    }

    const format =
      configFile.extension === 'ts' ||
      configFile.extension === 'js' ||
      configFile.extension === 'mjs' ||
      configFile.extension === 'cjs'
        ? configFile.extension
        : 'ts';

    return {
      path: configFile.path,
      format,
    };
  }

  private findVersion(dependencies: PackageDependency[], ...candidates: string[]): string | null {
    for (const candidate of candidates) {
      const found = dependencies.find((dependency) => dependency.name === candidate);
      if (found) {
        return found.version;
      }
    }

    return null;
  }
}
