import type { NamingConvention } from '../context/ProjectContext.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('NamingConventionService');

/**
 * NamingConventionService
 *
 * Analyzes file and class naming patterns across the project.
 * Identifies conventions for pages, tasks, tests, components, etc.
 */
export class NamingConventionService {
  public analyzePagesNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing page naming conventions', { count: paths.length });

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const patterns = this.detectPatterns(paths);

    const convention: NamingConvention = {
      pattern: patterns[0] || 'CamelCase with Page suffix',
      examples,
      description: 'Page Object Model naming convention',
    };

    logger.trace('Page naming analyzed', { pattern: convention.pattern, examples });
    return convention;
  }

  public analyzeTasksNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing task naming conventions', { count: paths.length });

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const patterns = this.detectPatterns(paths);

    const convention: NamingConvention = {
      pattern: patterns[0] || 'CamelCase with Task suffix',
      examples,
      description: 'Screenplay task naming convention',
    };

    logger.trace('Task naming analyzed', { pattern: convention.pattern, examples });
    return convention;
  }

  public analyzeTestsNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing test naming conventions', { count: paths.length });

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const patterns = this.detectPatterns(paths);

    const convention: NamingConvention = {
      pattern: patterns[0] || 'kebab-case.spec.ts',
      examples,
      description: 'Test file naming convention',
    };

    logger.trace('Test naming analyzed', { pattern: convention.pattern, examples });
    return convention;
  }

  public analyzeInteractionsNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing interaction naming conventions', { count: paths.length });

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const patterns = this.detectPatterns(paths);

    const convention: NamingConvention = {
      pattern: patterns[0] || 'CamelCase with action verb',
      examples,
      description: 'Interaction (atomic action) naming convention',
    };

    logger.trace('Interaction naming analyzed', { pattern: convention.pattern, examples });
    return convention;
  }

  public analyzeQuestionsNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing question naming conventions', { count: paths.length });

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const patterns = this.detectPatterns(paths);

    const convention: NamingConvention = {
      pattern: patterns[0] || 'CamelCase with question intent',
      examples,
      description: 'Question (state verification) naming convention',
    };

    logger.trace('Question naming analyzed', { pattern: convention.pattern, examples });
    return convention;
  }

  public analyzeComponentsNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing component naming conventions', { count: paths.length });

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const patterns = this.detectPatterns(paths);

    const convention: NamingConvention = {
      pattern: patterns[0] || 'PascalCase Component',
      examples,
      description: 'Component naming convention',
    };

    logger.trace('Component naming analyzed', { pattern: convention.pattern, examples });
    return convention;
  }

  public analyzeFilesNaming(paths: string[]): NamingConvention {
    logger.debug('Analyzing file naming conventions', { count: paths.length });

    const extensions = new Set(paths.map((p) => p.split('.').pop()));
    const isCamelCase = paths.some((p) => /[a-z][a-zA-Z]*\.(ts|js)/.test(p));
    const isKebabCase = paths.some((p) => /[a-z]+-[a-z]+\.(ts|js)/.test(p));

    const pattern = isKebabCase ? 'kebab-case' : isCamelCase ? 'camelCase' : 'mixed';

    const examples = paths.slice(0, 5).map((p) => this.extractName(p));
    const convention: NamingConvention = {
      pattern: `${pattern}.${Array.from(extensions).join('|')}`,
      examples,
      description: 'File naming convention',
    };

    logger.trace('File naming analyzed', { pattern: convention.pattern, extensions });
    return convention;
  }

  private extractName(path: string): string {
    return path.split('/').pop()?.split('.')[0] || path;
  }

  private detectPatterns(paths: string[]): string[] {
    if (paths.length === 0) {
      return [];
    }

    const names = paths.map((p) => this.extractName(p));
    const patterns: Record<string, number> = {};

    for (const name of names) {
      if (/^[A-Z][a-zA-Z]*$/.test(name)) {
        patterns['PascalCase'] = (patterns['PascalCase'] || 0) + 1;
      }
      if (/^[a-z][a-z0-9]*$/.test(name)) {
        patterns['camelCase'] = (patterns['camelCase'] || 0) + 1;
      }
      if (/^[a-z0-9]+-[a-z0-9-]*$/.test(name)) {
        patterns['kebab-case'] = (patterns['kebab-case'] || 0) + 1;
      }
      if (/^[A-Z]+_[A-Z0-9_]*$/.test(name)) {
        patterns['UPPER_SNAKE_CASE'] = (patterns['UPPER_SNAKE_CASE'] || 0) + 1;
      }
    }

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);
  }
}
