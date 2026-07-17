import { createLogger } from '../../logger/index.js';
import { createPromptMetadata } from '../models/PromptMetadata.js';
import type { PromptMetadata, TokenBreakdown, OptimizationMetrics, ValidationMetrics } from '../models/PromptMetadata.js';

export class PromptMetadataBuilder {
  private logger = createLogger('PromptMetadataBuilder');
  private metadata: PromptMetadata;

  constructor(template: string, aiRequestId: string) {
    this.metadata = createPromptMetadata(template, aiRequestId);
  }

  setTokens(breakdown: TokenBreakdown): this {
    this.metadata.tokens = breakdown;
    return this;
  }

  setSystemPromptTokens(tokens: number): this {
    this.metadata.tokens.systemPromptTokens = tokens;
    this.updateTotalTokens();
    return this;
  }

  setUserPromptTokens(tokens: number): this {
    this.metadata.tokens.userPromptTokens = tokens;
    this.updateTotalTokens();
    return this;
  }

  setOptimization(metrics: OptimizationMetrics): this {
    this.metadata.optimization = metrics;
    return this;
  }

  setValidation(metrics: ValidationMetrics): this {
    this.metadata.validation = metrics;
    return this;
  }

  setFramework(framework: string): this {
    this.metadata.framework = framework;
    return this;
  }

  setArchitecture(architecture: string): this {
    this.metadata.architecture = architecture;
    return this;
  }

  setEnvironment(environment: 'development' | 'staging' | 'production'): this {
    this.metadata.environment = environment;
    return this;
  }

  setRenderingTimeMs(ms: number): this {
    this.metadata.renderingTimeMs = ms;
    return this;
  }

  build(): PromptMetadata {
    return this.metadata;
  }

  static create(template: string, aiRequestId: string): PromptMetadataBuilder {
    return new PromptMetadataBuilder(template, aiRequestId);
  }

  private updateTotalTokens(): void {
    this.metadata.tokens.totalTokens =
      this.metadata.tokens.systemPromptTokens + this.metadata.tokens.userPromptTokens;
  }
}
