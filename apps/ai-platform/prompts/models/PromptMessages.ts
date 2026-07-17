/**
 * PromptMessages
 *
 * Provider-independent representation of prompt messages.
 * Output from Phase 4 (Prompt Rendering Layer).
 *
 * This is the bridge between Phase 4 (formatting) and Phase 5 (LLM providers).
 * Providers will transform this into their specific formats (OpenAI, Claude, etc.)
 */

import type { PromptMetadata } from './PromptMetadata.js';

export interface PromptMessages {
  /** System prompt - contains instructions, conventions, rules */
  systemPrompt: string;

  /** User prompt - contains request, context, examples */
  userPrompt: string;

  /** Metadata about the generated prompt */
  metadata: PromptMetadata;
}

/**
 * Enhanced PromptMessages with sections for analysis
 * Used during rendering for detailed tracking
 */
export interface EnhancedPromptMessages extends PromptMessages {
  /** Number of sections in system prompt */
  systemPromptSectionCount: number;

  /** Number of sections in user prompt */
  userPromptSectionCount: number;

  /** Sections that were removed due to token limits */
  removedSections: Array<{
    id: string;
    title: string;
    estimatedTokens: number;
    reason: string;
  }>;

  /** Sections that were compressed (shortened) */
  compressedSections: Array<{
    id: string;
    title: string;
    originalTokens: number;
    compressedTokens: number;
    reductionPercent: number;
  }>;
}

/**
 * Create a basic PromptMessages object
 */
export function createPromptMessages(
  systemPrompt: string,
  userPrompt: string,
  metadata: PromptMetadata,
): PromptMessages {
  return {
    systemPrompt,
    userPrompt,
    metadata,
  };
}

/**
 * Create an enhanced PromptMessages object with tracking info
 */
export function createEnhancedPromptMessages(
  systemPrompt: string,
  userPrompt: string,
  metadata: PromptMetadata,
  systemPromptSectionCount: number = 0,
  userPromptSectionCount: number = 0,
): EnhancedPromptMessages {
  return {
    systemPrompt,
    userPrompt,
    metadata,
    systemPromptSectionCount,
    userPromptSectionCount,
    removedSections: [],
    compressedSections: [],
  };
}
