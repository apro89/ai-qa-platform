/**
 * BasePromptTemplate
 *
 * Abstract base class for all prompt templates.
 * Provides common functionality for section building and validation.
 */

import { createLogger } from '../../logger/index.js';
import type { IPromptTemplate } from './iprompt-template.js';
import type { PromptSection, PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export abstract class BasePromptTemplate implements IPromptTemplate {
  protected logger = createLogger('PromptTemplate');

  constructor() {
    // Logger initialized above
  }

  abstract getName(): string;

  abstract getVersion(): string;

  abstract getSystemPromptSections(context: PromptContext): PromptSectionCollection;

  abstract getUserPromptSections(context: PromptContext): PromptSectionCollection;

  abstract getExpectedOutputDescription(): string;

  abstract getConstraints(): string[];

  abstract getExamples(): Array<{
    input: string;
    output: string;
    explanation: string;
  }>;

  isCompatible(templateType: string): boolean {
    return templateType === this.getName();
  }

  /**
   * Create a prompt section
   */
  protected createSection(
    id: string,
    title: string,
    content: string,
    priority: 'critical' | 'high' | 'normal' | 'low' = 'normal',
    category:
      'instructions' | 'context' | 'examples' | 'constraints' | 'requirements' = 'instructions',
    required: boolean = false,
  ): PromptSection {
    const estimatedTokens = Math.ceil(content.split(/\s+/).length * 1.3);

    return {
      id,
      title,
      content,
      priority,
      required,
      estimatedTokens,
      category,
    };
  }

  /**
   * Create a section collection
   */
  protected createSectionCollection(): PromptSectionCollection {
    return {
      instructions: [],
      context: [],
      examples: [],
      constraints: [],
      requirements: [],
    };
  }

  /**
   * Add a section to a collection by category
   */
  protected addSection(collection: PromptSectionCollection, section: PromptSection): void {
    collection[section.category].push(section);
  }

  /**
   * Calculate total tokens in a section collection
   */
  protected calculateTotalTokens(collection: PromptSectionCollection): number {
    return Object.values(collection)
      .flat()
      .reduce((total, section) => total + section.estimatedTokens, 0);
  }

  /**
   * Get all sections from a collection (flattened)
   */
  protected getAllSections(collection: PromptSectionCollection): PromptSection[] {
    return Object.values(collection).flat();
  }

  /**
   * Get sections by priority (for token optimization)
   */
  protected getSectionsByPriority(
    collection: PromptSectionCollection,
    priority: 'critical' | 'high' | 'normal' | 'low',
  ): PromptSection[] {
    return this.getAllSections(collection).filter((s) => s.priority === priority);
  }

  /**
   * Log template information
   */
  protected logTemplateInfo(): void {
    this.logger.debug(`Using template: ${this.getName()} v${this.getVersion()}`);
  }
}
