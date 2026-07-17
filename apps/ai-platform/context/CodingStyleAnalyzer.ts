import type { ScannedProject } from '../models/scan-models.js';
import type { CodingStyle } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('CodingStyleAnalyzer');

/**
 * CodingStyleAnalyzer
 *
 * Analyzes code patterns across the project to determine:
 * - Async/await usage
 * - Assertion libraries
 * - Locator styles
 * - Import patterns
 * - TypeScript usage
 * - Module syntax
 */
export class CodingStyleAnalyzer {
  public analyze(project: ScannedProject): CodingStyle {
    logger.debug('Analyzing project coding style');

    const typescriptUsage = this.detectTypeScriptUsage(project);
    const asyncAwait = this.detectAsyncAwaitUsage(project);
    const assertionLibrary = this.detectAssertionLibrary(project);
    const locatorStyle = this.detectLocatorStyle(project);
    const importStyle = this.detectImportStyle(project);
    const moduleSyntax = this.detectModuleSyntax(project);
    const decoratorsUsed = this.detectDecoratorUsage(project);

    const style: CodingStyle = {
      asyncAwait,
      assertionLibrary,
      locatorStyle,
      importStyle,
      moduleSyntax,
      typeScriptUsage: typescriptUsage,
      decoratorsUsed,
    };

    logger.info('Coding style analysis completed', {
      asyncAwait,
      assertionLibrary,
      locatorStyle,
      importStyle,
      moduleSyntax,
      typescript: typescriptUsage,
      decorators: decoratorsUsed,
    });

    return style;
  }

  private detectTypeScriptUsage(project: ScannedProject): boolean {
    const tsFiles = project.files.filter((f) => f.extension === 'ts' || f.extension === 'tsx');
    const usage = tsFiles.length > 0;
    logger.trace('TypeScript usage detected', { tsFiles: tsFiles.length, detected: usage });
    return usage;
  }

  private detectAsyncAwaitUsage(project: ScannedProject): boolean {
    const asyncUsage = project.files.some((file) => {
      const content = file.content ?? '';
      return /async\s+\w+|await\s+/.test(content);
    });
    logger.trace('Async/await usage detected', { detected: asyncUsage });
    return asyncUsage;
  }

  private detectAssertionLibrary(project: ScannedProject): string | null {
    const assertions = {
      'Playwright Expect': /expect\(/g,
      Chai: /expect\(.*\)\.to|assert\./g,
      Jest: /expect\(/g,
    };

    for (const [lib, pattern] of Object.entries(assertions)) {
      const count = project.files
        .map((f) => (f.content ?? '').match(pattern)?.length ?? 0)
        .reduce((a, b) => a + b, 0);

      if (count > 0) {
        logger.trace('Assertion library detected', { library: lib, usage: count });
        return lib;
      }
    }

    logger.trace('No assertion library detected');
    return null;
  }

  private detectLocatorStyle(project: ScannedProject): string | null {
    const styles: Record<string, RegExp> = {
      getByRole: /getByRole\(/,
      getByTestId: /getByTestId\(/,
      locator: /\.locator\(/,
      querySelector: /querySelector/,
      XPath: /xpath|\/\//,
    };

    for (const [style, pattern] of Object.entries(styles)) {
      const count = project.files
        .map((f) => (f.content ?? '').match(pattern)?.length ?? 0)
        .reduce((a, b) => a + b, 0);

      if (count > 0) {
        logger.trace('Locator style detected', { style, usage: count });
        return style;
      }
    }

    logger.trace('No specific locator style detected');
    return null;
  }

  private detectImportStyle(project: ScannedProject): 'absolute' | 'relative' | 'mixed' {
    let absoluteCount = 0;
    let relativeCount = 0;

    for (const file of project.files) {
      const content = file.content ?? '';
      const importLines = content.match(/import\s+.*?\s+from\s+['"][^'"]+['"]/g) || [];

      for (const line of importLines) {
        if (/from\s+['"]\.\.?\//.test(line)) {
          relativeCount++;
        } else if (/from\s+['"]@|from\s+['"][a-z]/.test(line)) {
          absoluteCount++;
        }
      }
    }

    const style =
      absoluteCount > relativeCount * 2
        ? 'absolute'
        : relativeCount > absoluteCount * 2
          ? 'relative'
          : 'mixed';

    logger.trace('Import style detected', {
      style,
      absolute: absoluteCount,
      relative: relativeCount,
    });
    return style;
  }

  private detectModuleSyntax(project: ScannedProject): 'esm' | 'cjs' | 'mixed' {
    let esmCount = 0;
    let cjsCount = 0;

    for (const file of project.files) {
      const content = file.content ?? '';
      if (/import\s+.*?\s+from|export\s+(default|class|interface|const)/.test(content)) {
        esmCount++;
      }
      if (/require\(|module\.exports|exports\./.test(content)) {
        cjsCount++;
      }
    }

    const syntax = esmCount > cjsCount * 2 ? 'esm' : cjsCount > esmCount * 2 ? 'cjs' : 'mixed';

    logger.trace('Module syntax detected', { syntax, esm: esmCount, cjs: cjsCount });
    return syntax;
  }

  private detectDecoratorUsage(project: ScannedProject): boolean {
    const decoratorUsage = project.files.some((file) => {
      const content = file.content ?? '';
      return /@\w+\(|@\w+\s+(class|method|property|get|set)/.test(content);
    });

    logger.trace('Decorator usage detected', { detected: decoratorUsage });
    return decoratorUsage;
  }
}
