import { createLogger } from '../../logger/index.js';
import type { AIRequest } from '../../ai/AIRequest.js';
import type { PromptMessages } from '../models/PromptMessages.js';
import type { PromptSection } from '../models/PromptSection.js';
import { createPromptContext } from '../models/PromptContext.js';
import { createPromptMessages } from '../models/PromptMessages.js';
import { createPromptMetadata } from '../models/PromptMetadata.js';
import { RenderingError } from '../errors/PromptRenderingError.js';
import { PromptValidator } from './prompt-validator.js';
import { PromptTemplateEngine } from './prompt-template-engine.js';
import { PromptFormatter } from './prompt-formatter.js';
import { PromptSanitizer } from './prompt-sanitizer.js';

export class PromptRenderer {
  private logger = createLogger('PromptRenderer');
  private validator: PromptValidator;
  private templateEngine: PromptTemplateEngine;
  private formatter: PromptFormatter;
  private sanitizer: PromptSanitizer;

  constructor() {
    this.validator = new PromptValidator();
    this.templateEngine = new PromptTemplateEngine();
    this.formatter = new PromptFormatter();
    this.sanitizer = new PromptSanitizer();
  }

  async render(aiRequest: AIRequest): Promise<PromptMessages> {
    const startTime = Date.now();

    try {
      this.validator.validateAIRequest(aiRequest);
      const template = this.templateEngine.getTemplate(aiRequest.templateType);
      const context = createPromptContext(aiRequest);

      const systemCollection = template.getSystemPromptSections(context);
      const userCollection = template.getUserPromptSections(context);

      const systemPrompt = this.sanitizer.sanitize(this.formatSections(
        Object.values(systemCollection).flat()
      ));
      const userPrompt = this.sanitizer.sanitize(this.formatSections(
        Object.values(userCollection).flat()
      ));

      const metadata = createPromptMetadata(aiRequest.templateType, aiRequest.requestId);
      metadata.framework = aiRequest.projectContext.framework || 'Unknown';
      metadata.architecture = aiRequest.projectContext.architecture || 'Unknown';
      metadata.renderingTimeMs = Date.now() - startTime;
      metadata.tokens.systemPromptTokens = this.formatter.estimateTokens(systemPrompt);
      metadata.tokens.userPromptTokens = this.formatter.estimateTokens(userPrompt);
      metadata.tokens.totalTokens = metadata.tokens.systemPromptTokens + metadata.tokens.userPromptTokens;

      const promptMessages = createPromptMessages(systemPrompt, userPrompt, metadata);
      this.logger.info(`Rendered prompt: ${metadata.tokens.totalTokens} tokens in ${metadata.renderingTimeMs}ms`);

      return promptMessages;
    } catch (error) {
      const message = `Rendering failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(message);
      throw new RenderingError(message, { aiRequestId: aiRequest.requestId });
    }
  }

  private formatSections(sections: PromptSection[]): string {
    return sections
      .map(section => this.formatter.formatSection(section, 2).fullText)
      .join('\n\n');
  }

  getAvailableTemplates(): string[] {
    return this.templateEngine.getTemplateNames();
  }
}
