import type {
  PackageDependency,
  PackageInfo,
  PlaywrightConfigInfo,
} from '../models/project-structure.js';
import type { PackageJsonModel, ScannedProject } from '../models/scan-models.js';

export interface DependencyAnalysisResult {
  dependencies: PackageDependency[];
  packageInfo: PackageInfo | null;
  playwrightConfig: PlaywrightConfigInfo | null;
  playwrightVersion: string | null;
  typescriptVersion: string | null;
}

export class DependencyAnalyzer {
  public analyze(project: ScannedProject): DependencyAnalysisResult {
    const packageFile = project.files.find((file) => file.path === 'package.json');
    const packageJson = this.parsePackageJson(packageFile?.content);
    const dependencies = this.extractDependencies(packageJson);

    return {
      dependencies,
      packageInfo: packageJson
        ? {
            name: packageJson.name ?? null,
            version: packageJson.version ?? null,
            private: typeof packageJson.private === 'boolean' ? packageJson.private : null,
          }
        : null,
      playwrightConfig: this.detectPlaywrightConfig(project),
      playwrightVersion: this.findVersion(dependencies, '@playwright/test', 'playwright'),
      typescriptVersion: this.findVersion(dependencies, 'typescript'),
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
