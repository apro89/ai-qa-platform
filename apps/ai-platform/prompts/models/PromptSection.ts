/**
 * PromptSection
 *
 * Represents a single section of a prompt.
 * Used to build system and user prompts from templates.
 */

export interface PromptSection {
  /** Unique identifier for the section */
  id: string;

  /** Section title (used as heading in formatted prompt) */
  title: string;

  /** Section content (main text) */
  content: string;

  /** Priority level - determines inclusion when optimizing tokens */
  priority: 'critical' | 'high' | 'normal' | 'low';

  /** Whether this section should always be included */
  required: boolean;

  /** Approximate token count for this section */
  estimatedTokens: number;

  /** Section category for organization */
  category: 'instructions' | 'context' | 'examples' | 'constraints' | 'requirements';

  /** Optional: Section template variables that need resolution */
  variables?: Record<string, string | number | boolean>;
}

/**
 * PromptSectionCollection
 * Grouped sections by category
 */
export interface PromptSectionCollection {
  instructions: PromptSection[];
  context: PromptSection[];
  examples: PromptSection[];
  constraints: PromptSection[];
  requirements: PromptSection[];
}
