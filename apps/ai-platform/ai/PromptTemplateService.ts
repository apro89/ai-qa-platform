/**
 * PromptTemplateService
 *
 * Manages reusable prompt templates with extensibility for future template types.
 */

import type { ExpectedOutput } from './AIRequest.js';
import type { Logger } from '../logger/Logger.js';

export interface PromptTemplate {
  name: string;
  description: string;
  expectedOutput: ExpectedOutput;
  context: {
    maxTokens?: number;
    temperature?: number;
    focusAreas: string[];
  };
}

export class PromptTemplateService {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor(private readonly logger: Logger) {
    this.registerDefaultTemplates();
  }

  getTemplate(templateType: string): PromptTemplate {
    const template = this.templates.get(templateType);
    if (!template) {
      this.logger.warn('Template not found, using default', { templateType });
      return this.getDefaultTemplate();
    }
    return template;
  }

  registerTemplate(name: string, template: PromptTemplate): void {
    this.templates.set(name, template);
    this.logger.debug('Template registered', { name });
  }

  private registerDefaultTemplates(): void {
    this.templates.set('GenerateAutomation', {
      name: 'GenerateAutomation',
      description: 'Generate complete Playwright tests with Screenplay Pattern',
      expectedOutput: {
        format: 'TypeScript',
        schema: {
          files: {
            type: 'array',
            items: {
              name: 'string',
              path: 'string',
              content: 'string',
            },
          },
        },
        examples: ['Complete test file with Task and Interaction implementations'],
        constraints: [
          'Only generate missing files',
          'Reuse existing Tasks/Questions',
          'Follow exact naming conventions',
          'Include all necessary imports',
        ],
      },
      context: {
        maxTokens: 4096,
        temperature: 0.2,
        focusAreas: ['business requirement', 'reusable components', 'naming consistency'],
      },
    });

    this.templates.set('GenerateTask', {
      name: 'GenerateTask',
      description: 'Generate a single reusable Task',
      expectedOutput: {
        format: 'TypeScript',
        examples: ['Task orchestrating multiple Interactions'],
        constraints: ['Single responsibility', 'Use existing Interactions', 'Return data when needed'],
      },
      context: {
        maxTokens: 2048,
        temperature: 0.2,
        focusAreas: ['orchestration', 'composition', 'clarity'],
      },
    });

    this.templates.set('GenerateQuestion', {
      name: 'GenerateQuestion',
      description: 'Generate a Question for state verification',
      expectedOutput: {
        format: 'TypeScript',
        examples: ['Question returning boolean or state data'],
        constraints: ['Never modify state', 'Use Page selectors', 'Clear assertion path'],
      },
      context: {
        maxTokens: 1024,
        temperature: 0.2,
        focusAreas: ['state retrieval', 'clarity', 'reusability'],
      },
    });

    this.templates.set('GenerateInteraction', {
      name: 'GenerateInteraction',
      description: 'Generate an atomic Interaction',
      expectedOutput: {
        format: 'TypeScript',
        examples: ['Click, Fill, Select, UploadFile'],
        constraints: ['Single atomic action', 'Use Page locators', 'Type-safe'],
      },
      context: {
        maxTokens: 1024,
        temperature: 0.2,
        focusAreas: ['atomicity', 'reusability', 'implementation'],
      },
    });

    this.logger.debug('Default templates registered', {
      count: this.templates.size,
    });
  }

  private getDefaultTemplate(): PromptTemplate {
    return this.templates.get('GenerateAutomation') || {
      name: 'Default',
      description: 'Default template',
      expectedOutput: {
        format: 'JSON',
      },
      context: {
        maxTokens: 2048,
        focusAreas: [],
      },
    };
  }
}
