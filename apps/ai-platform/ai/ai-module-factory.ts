import { AIRequestBuilder } from './AIRequestBuilder.js';
import { InstructionBuilder } from './InstructionBuilder.js';
import { ContextSelector } from './ContextSelector.js';
import { ContextCompressor } from './ContextCompressor.js';
import { PromptTemplateService } from './PromptTemplateService.js';
import { RequestValidator } from './RequestValidator.js';
import { TokenEstimator } from './TokenEstimator.js';
import { createLogger } from '../logger/LoggerFactory.js';
import type { LogLevel } from '../logger/LogLevel.js';

export class AIModuleFactory {
  static createRequestBuilder(_logLevel?: LogLevel): AIRequestBuilder {
    const logger = createLogger('AIRequestBuilder');
    const instructionBuilder = new InstructionBuilder(createLogger('InstructionBuilder'));
    const contextSelector = new ContextSelector(createLogger('ContextSelector'));
    const contextCompressor = new ContextCompressor(createLogger('ContextCompressor'), 50000);
    const templateService = new PromptTemplateService(createLogger('PromptTemplateService'));
    const validator = new RequestValidator(createLogger('RequestValidator'));
    const tokenEstimator = new TokenEstimator(createLogger('TokenEstimator'), 128000);

    return new AIRequestBuilder(
      instructionBuilder,
      contextSelector,
      contextCompressor,
      templateService,
      validator,
      tokenEstimator,
      logger,
    );
  }
}
