import type { ProjectContext } from '../context/ProjectContext.js';
import type { AIRequest } from './AIRequest.js';
import type { Logger } from '../logger/Logger.js';
import { InstructionBuilder } from './InstructionBuilder.js';
import { ContextSelector } from './ContextSelector.js';
import { ContextCompressor } from './ContextCompressor.js';
import { PromptTemplateService } from './PromptTemplateService.js';
import { RequestValidator } from './RequestValidator.js';
import { TokenEstimator } from './TokenEstimator.js';

export interface BuildRequest {
  projectContext: ProjectContext;
  userRequest: string;
  templateType?: string;
  constraints?: Record<string, unknown>;
}

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class AIRequestBuilder {
  constructor(
    private readonly instructionBuilder: InstructionBuilder,
    private readonly contextSelector: ContextSelector,
    private readonly contextCompressor: ContextCompressor,
    private readonly templateService: PromptTemplateService,
    private readonly validator: RequestValidator,
    private readonly tokenEstimator: TokenEstimator,
    private readonly logger: Logger,
  ) {}

  async build(input: BuildRequest): Promise<AIRequest> {
    const startTime = performance.now();
    const requestId = generateId();
    const templateType = input.templateType || 'GenerateAutomation';

    this.logger.info('Building AI request', {
      requestId,
      template: templateType,
      userRequest: input.userRequest.substring(0, 50) + '...',
    });

    try {
      this.validator.validateInput({
        projectContext: input.projectContext,
        userRequest: input.userRequest,
        templateType,
      });

      const selectedContext = this.contextSelector.selectRelevantContext(
        input.projectContext,
        input.userRequest,
      );

      this.logger.debug('Context selected', {
        requestId,
        selectedPages: selectedContext.pages.length,
        selectedTasks: selectedContext.tasks.length,
        selectedQuestions: selectedContext.questions.length,
        selectedInteractions: selectedContext.interactions.length,
      });

      const compressedContext = this.contextCompressor.compress(selectedContext);

      const systemInstructions = this.instructionBuilder.build(input.projectContext, templateType);

      const template = this.templateService.getTemplate(templateType);

      const tokenCount = this.tokenEstimator.estimate({
        instructions: systemInstructions,
        context: compressedContext,
        userRequest: input.userRequest,
      });

      this.logger.info('Token estimation complete', {
        requestId,
        estimatedTokens: tokenCount,
      });

      const aiRequest: AIRequest = {
        requestId,
        templateType,
        objective: this.buildObjective(input.userRequest, templateType),
        userRequest: input.userRequest,
        projectContext: {
          framework: input.projectContext.framework,
          frameworkVersion: input.projectContext.frameworkVersion,
          architecture: input.projectContext.architecture,
          typescriptVersion: input.projectContext.typescriptVersion,
          namingConventions: input.projectContext.namingConventions as unknown as Record<
            string,
            unknown
          >,
          codingStyle: input.projectContext.codingStyle as unknown as Record<string, unknown>,
          folderStructure: input.projectContext.folderStructure,
        },
        systemInstructions,
        reusablePatterns: {
          pages: selectedContext.pages.map((p) => ({
            name: p.name,
            path: p.path,
            summary: `Page object for ${p.name}`,
          })),
          tasks: selectedContext.tasks.map((t) => ({
            name: t.name,
            path: t.path,
            summary: `Task for ${t.name}`,
          })),
          questions: selectedContext.questions.map((q) => ({
            name: q.name,
            path: q.path,
            summary: `Question for ${q.name}`,
          })),
          interactions: selectedContext.interactions.map((i) => ({
            name: i.name,
            path: i.path,
            summary: `Interaction: ${i.name}`,
          })),
        },
        expectedOutput: template.expectedOutput,
        metadata: {
          contextMetadata: {
            selectedPages: selectedContext.pages.length,
            selectedTasks: selectedContext.tasks.length,
            selectedQuestions: selectedContext.questions.length,
            selectedInteractions: selectedContext.interactions.length,
            estimatedTokenCount: tokenCount,
            compressionRatio: this.calculateCompressionRatio(selectedContext, compressedContext),
            timestamp: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          createdBy: 'AIRequestBuilder',
          version: '1.0.0',
        },
      };

      this.validator.validateRequest(aiRequest);

      const duration = performance.now() - startTime;
      this.logger.info('AI request built successfully', {
        requestId,
        duration: `${duration.toFixed(2)}ms`,
        tokenCount,
      });

      return aiRequest;
    } catch (error) {
      this.logger.error('Failed to build AI request', error instanceof Error ? error : undefined, {
        requestId,
      });
      throw error;
    }
  }

  private buildObjective(userRequest: string, templateType: string): string {
    const objectives: Record<string, string> = {
      GenerateAutomation: `Generate comprehensive Playwright automation following Screenplay Pattern for: ${userRequest}`,
      GenerateTask: `Create a reusable Task following Screenplay Pattern for: ${userRequest}`,
      GenerateQuestion: `Create a Question for state verification: ${userRequest}`,
      GenerateInteraction: `Create an atomic Interaction: ${userRequest}`,
      RefactorAutomation: `Refactor automation to improve quality: ${userRequest}`,
      ExplainCode: `Explain the code structure and patterns: ${userRequest}`,
    };
    return objectives[templateType] || userRequest;
  }

  private calculateCompressionRatio(original: unknown, compressed: unknown): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = JSON.stringify(compressed).length;
    return originalSize > 0 ? originalSize / compressedSize : 1;
  }
}
