import type { PatternType } from '../models/project-structure.js';
import type { ParsedProjectArtifacts, ScannedProject } from '../models/scan-models.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('PatternDetector');

export interface PatternDetectionContext {
  parsed: ParsedProjectArtifacts;
  project: ScannedProject;
}

export interface PatternRule {
  type: Exclude<PatternType, 'hybrid' | 'unknown'>;
  detect(context: PatternDetectionContext): boolean;
}

export class PatternDetector {
  private readonly rules: PatternRule[];

  public constructor(
    rules: PatternRule[] = [new ScreenplayPatternRule(), new PageObjectPatternRule()],
  ) {
    this.rules = [...rules];
  }

  public registerRule(rule: PatternRule): void {
    this.rules.push(rule);
  }

  public detect(context: PatternDetectionContext): {
    detectedPattern: PatternType;
    supportedPatterns: PatternType[];
  } {
    logger.debug('Starting pattern detection', {
      tasks: context.parsed.tasks.length,
      pages: context.parsed.pages.length,
      interactions: context.parsed.interactions.length,
      questions: context.parsed.questions.length,
    });

    const supportedPatterns = this.rules
      .filter((rule) => {
        const isDetected = rule.detect(context);
        logger.trace('Pattern rule evaluated', {
          pattern: rule.type,
          detected: isDetected,
        });
        return isDetected;
      })
      .map((rule) => rule.type);

    logger.debug('Pattern rules evaluated', {
      patternsFound: supportedPatterns,
      totalRules: this.rules.length,
    });

    let result: { detectedPattern: PatternType; supportedPatterns: PatternType[] };
    if (supportedPatterns.length > 1) {
      logger.info('Pattern detected', {
        pattern: 'hybrid',
        reason: 'Multiple patterns detected in project',
        evidence: supportedPatterns,
      });
      result = {
        detectedPattern: 'hybrid' as const,
        supportedPatterns: [...supportedPatterns, 'hybrid' as const],
      };
    } else if (supportedPatterns.length === 1) {
      logger.info('Pattern detected', {
        pattern: supportedPatterns[0],
        reason: `${supportedPatterns[0]} pattern structure found`,
      });
      result = {
        detectedPattern: supportedPatterns[0],
        supportedPatterns,
      };
    } else {
      logger.warn('No recognized pattern detected', {
        pattern: 'unknown',
        reason: 'Project structure does not match known patterns',
      });
      result = {
        detectedPattern: 'unknown' as const,
        supportedPatterns: ['unknown' as const],
      };
    }

    return result;
  }
}

class ScreenplayPatternRule implements PatternRule {
  public readonly type = 'screenplay' as const;

  public detect(context: PatternDetectionContext): boolean {
    const hasCoreFolders =
      context.parsed.tasks.length > 0 &&
      context.parsed.interactions.length > 0 &&
      context.parsed.questions.length > 0;

    if (hasCoreFolders) {
      logger.trace('Screenplay pattern detected', {
        reason: 'Core folders found',
        evidence: {
          tasks: context.parsed.tasks.length,
          interactions: context.parsed.interactions.length,
          questions: context.parsed.questions.length,
        },
      });
      return true;
    }

    const hasScreenplayApis = context.project.files.some((file) => {
      const content = file.content ?? '';
      return /actor\.attemptsTo|Task\.where|Performable|Question<.+>/.test(content);
    });

    if (hasScreenplayApis) {
      logger.trace('Screenplay pattern detected', {
        reason: 'Screenplay API usage found in code',
        evidence: ['actor.attemptsTo', 'Task.where', 'Performable', 'Question'],
      });
    }

    return hasScreenplayApis;
  }
}

class PageObjectPatternRule implements PatternRule {
  public readonly type = 'page-object-model' as const;

  public detect(context: PatternDetectionContext): boolean {
    if (context.parsed.pages.length === 0) {
      logger.trace('Page Object Model pattern not detected', {
        reason: 'No pages found',
      });
      return false;
    }

    const pageObjectSignals = context.project.files.some((file) => {
      if (!/pages\/.+\.(ts|tsx|js|mjs|cjs)$/.test(file.path)) {
        return false;
      }

      const content = file.content ?? '';
      return /class\s+\w+Page|locator\(|getByRole\(|getByTestId\(/.test(content);
    });

    if (pageObjectSignals) {
      logger.trace('Page Object Model pattern detected', {
        reason: 'Page files with locator patterns found',
        evidence: {
          pages: context.parsed.pages.length,
          signals: ['locator()', 'getByRole()', 'getByTestId()', 'class...Page'],
        },
      });
    }

    return pageObjectSignals;
  }
}
