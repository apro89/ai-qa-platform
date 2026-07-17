/**
 * IPromptTemplate
 *
 * Interface that all prompt templates must implement.
 * Each template knows how to structure system and user prompts
 * for a specific use case (GenerateAutomation, GenerateTask, etc.)
 */

import type { PromptSection, PromptSectionCollection } from '../models/PromptSection.js';
import type { PromptContext } from '../models/PromptContext.js';

export interface IPromptTemplate {
  /** Template name/type */
  getName(): string;

  /** Template version */
  getVersion(): string;

  /** Get system prompt sections */
  getSystemPromptSections(context: PromptContext): PromptSectionCollection;

  /** Get user prompt sections */
  getUserPromptSections(context: PromptContext): PromptSectionCollection;

  /** Get expected output format from template */
  getExpectedOutputDescription(): string;

  /** Get constraint rules for this template */
  getConstraints(): string[];

  /** Get examples specific to this template */
  getExamples(): Array<{
    input: string;
    output: string;
    explanation: string;
  }>;

  /** Validate that AIRequest is compatible with this template */
  isCompatible(templateType: string): boolean;
}
