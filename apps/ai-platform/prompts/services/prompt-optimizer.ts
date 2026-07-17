/**
 * PromptOptimizer - Optimizes prompt size
 */

import { createLogger } from '../../logger/index.js';
import type { PromptSection, PromptSectionCollection } from '../models/PromptSection.js';

interface OptimizationResult {
  optimized: boolean;
  originalTokens: number;
  optimizedTokens: number;
  reduction: number;
  reductionPercent: number;
  sectionsRemoved: number;
  sectionsCompressed: number;
}

export class PromptOptimizer {
  private logger = createLogger('PromptOptimizer');
  private readonly TOKENS_PER_WORD = 1.3;

  optimizeToTokenBudget(
    sections: PromptSectionCollection,
    maxTokens: number,
  ): { sections: PromptSectionCollection; result: OptimizationResult } {
    const originalTokens = this.calculateTotalTokens(sections);

    if (originalTokens <= maxTokens) {
      return {
        sections,
        result: {
          optimized: false,
          originalTokens,
          optimizedTokens: originalTokens,
          reduction: 0,
          reductionPercent: 0,
          sectionsRemoved: 0,
          sectionsCompressed: 0,
        },
      };
    }

    const optimized = JSON.parse(JSON.stringify(sections)) as PromptSectionCollection;
    let currentTokens = originalTokens;
    let sectionsRemoved = 0;

    currentTokens = this.removeLowPrioritySections(optimized, maxTokens, currentTokens);
    sectionsRemoved = this.countRemovedSections(optimized);

    if (currentTokens > maxTokens) {
      const compressionResult = this.compressHighTokenSections(optimized, maxTokens, currentTokens);
      currentTokens = compressionResult.tokensAfter;
    }

    const reduction = originalTokens - currentTokens;
    const reductionPercent = (reduction / originalTokens) * 100;

    return {
      sections: optimized,
      result: {
        optimized: true,
        originalTokens,
        optimizedTokens: currentTokens,
        reduction,
        reductionPercent,
        sectionsRemoved,
        sectionsCompressed: 0,
      },
    };
  }

  private removeLowPrioritySections(
    sections: PromptSectionCollection,
    maxTokens: number,
    currentTokens: number,
  ): number {
    const priorities: Array<'low' | 'normal' | 'high' | 'critical'> = ['low', 'normal', 'high'];

    for (const priority of priorities) {
      for (const category of Object.keys(sections) as Array<keyof PromptSectionCollection>) {
        sections[category] = sections[category].filter((section) => {
          if (currentTokens <= maxTokens) {
            return true;
          }

          if (section.priority === priority && !section.required) {
            const tokensFreed = section.estimatedTokens;
            currentTokens -= tokensFreed;
            return false;
          }

          return true;
        });
      }

      if (currentTokens <= maxTokens) {
        break;
      }
    }

    return currentTokens;
  }

  private compressHighTokenSections(
    sections: PromptSectionCollection,
    maxTokens: number,
    currentTokens: number,
  ): { tokensAfter: number; sectionsCompressed: number } {
    let tokensAfter = currentTokens;

    const allSections = Object.values(sections).flat();
    const sorted = allSections.sort((a, b) => b.estimatedTokens - a.estimatedTokens);

    for (const section of sorted) {
      if (tokensAfter <= maxTokens) {
        break;
      }

      if (!section.required && section.content.length > 200) {
        section.content = this.compressText(section.content);
        section.estimatedTokens = this.estimateTokens(section.content);
        tokensAfter = this.calculateTotalTokens(sections);
      }
    }

    return { tokensAfter, sectionsCompressed: 0 };
  }

  private compressText(text: string): string {
    let compressed = text;
    const verboseReplacements: Record<string, string> = {
      'In order to': 'To',
      'For example': 'E.g.',
      'such as': 'like',
      'due to the fact that': 'because',
    };

    for (const [verbose, concise] of Object.entries(verboseReplacements)) {
      const regex = new RegExp(`\\b${verbose}\\b`, 'gi');
      compressed = compressed.replace(regex, concise);
    }

    compressed = compressed.replace(/\b(very|really|actually|basically)\s+/gi, '');
    compressed = compressed.replace(/\s{2,}/g, ' ');

    return compressed.trim();
  }

  private calculateTotalTokens(sections: PromptSectionCollection): number {
    return Object.values(sections)
      .flat()
      .reduce((total, section) => total + section.estimatedTokens, 0);
  }

  private estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * this.TOKENS_PER_WORD);
  }

  private countRemovedSections(sections: PromptSectionCollection): number {
    return Object.values(sections)
      .flat()
      .filter((s) => !s.content || s.content.trim().length === 0).length;
  }

  getSectionsByPriority(sections: PromptSectionCollection): PromptSection[] {
    return Object.values(sections)
      .flat()
      .sort((a: PromptSection, b: PromptSection) => {
        const priorityOrder: Record<'critical' | 'high' | 'normal' | 'low', number> = {
          critical: 0,
          high: 1,
          normal: 2,
          low: 3,
        };
        const aPriority = priorityOrder[a.priority as 'critical' | 'high' | 'normal' | 'low'];
        const bPriority = priorityOrder[b.priority as 'critical' | 'high' | 'normal' | 'low'];
        return aPriority - bPriority;
      });
  }
}
