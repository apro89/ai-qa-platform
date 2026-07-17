import type { PatternType } from '../models/project-structure.js';
import type { ParsedProjectArtifacts, ScannedProject } from '../models/scan-models.js';

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
    const supportedPatterns = this.rules
      .filter((rule) => rule.detect(context))
      .map((rule) => rule.type);

    if (supportedPatterns.length > 1) {
      return {
        detectedPattern: 'hybrid',
        supportedPatterns: [...supportedPatterns, 'hybrid'],
      };
    }

    if (supportedPatterns.length === 1) {
      return {
        detectedPattern: supportedPatterns[0],
        supportedPatterns,
      };
    }

    return {
      detectedPattern: 'unknown',
      supportedPatterns: ['unknown'],
    };
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
      return true;
    }

    const hasScreenplayApis = context.project.files.some((file) => {
      const content = file.content ?? '';
      return /actor\.attemptsTo|Task\.where|Performable|Question<.+>/.test(content);
    });

    return hasScreenplayApis;
  }
}

class PageObjectPatternRule implements PatternRule {
  public readonly type = 'page-object-model' as const;

  public detect(context: PatternDetectionContext): boolean {
    if (context.parsed.pages.length === 0) {
      return false;
    }

    const pageObjectSignals = context.project.files.some((file) => {
      if (!/pages\/.+\.(ts|tsx|js|mjs|cjs)$/.test(file.path)) {
        return false;
      }

      const content = file.content ?? '';
      return /class\s+\w+Page|locator\(|getByRole\(|getByTestId\(/.test(content);
    });

    return pageObjectSignals;
  }
}
