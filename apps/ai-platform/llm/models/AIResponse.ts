/**
 * Provider-independent LLM response model.
 * Abstracts away provider-specific response formats.
 */

import { AIUsage } from './AIUsage.js';

export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'unknown';

export interface AIResponseMetadata {
  provider: string;
  model: string;
  finishReason: FinishReason;
  createdAt: Date;
  requestId?: string;
}

export class AIResponse {
  constructor(
    /** The generated content from the LLM */
    public readonly content: string,

    /** Token usage information */
    public readonly usage: AIUsage,

    /** Metadata about the response */
    public readonly metadata: AIResponseMetadata
  ) {}

  /**
   * Check if response generation completed normally
   */
  isComplete(): boolean {
    return this.metadata.finishReason === 'stop';
  }

  /**
   * Check if response was truncated due to token limit
   */
  isTruncated(): boolean {
    return this.metadata.finishReason === 'length';
  }

  /**
   * Check if response was blocked by content filter
   */
  isFiltered(): boolean {
    return this.metadata.finishReason === 'content_filter';
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      content: this.content,
      usage: this.usage,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt.toISOString(),
      },
    };
  }

  /**
   * Create from OpenAI response
   */
  static fromOpenAI(response: any, model: string, usage: AIUsage): AIResponse {
    const choice = response.choices?.[0];
    const finishReason = this.mapFinishReason(choice?.finish_reason);

    return new AIResponse(choice?.message?.content || '', usage, {
      provider: 'openai',
      model,
      finishReason,
      createdAt: new Date(response.created ? response.created * 1000 : Date.now()),
      requestId: response.id,
    });
  }

  private static mapFinishReason(openaiReason: string | undefined): FinishReason {
    const reasonMap: Record<string, FinishReason> = {
      stop: 'stop',
      length: 'length',
      tool_calls: 'tool_calls',
      content_filter: 'content_filter',
    };
    return reasonMap[openaiReason || ''] || 'unknown';
  }
}
