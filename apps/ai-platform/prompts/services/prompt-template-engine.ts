import { createLogger } from '../../logger/index.js';
import { TemplateError } from '../errors/PromptRenderingError.js';
import type { IPromptTemplate } from '../templates/iprompt-template.js';
import { GenerateAutomationTemplate } from '../templates/generate-automation-template.js';
import { GenerateTaskTemplate } from '../templates/generate-task-template.js';
import { GenerateQuestionTemplate } from '../templates/generate-question-template.js';
import { GenerateInteractionTemplate } from '../templates/generate-interaction-template.js';
import { RefactorAutomationTemplate } from '../templates/refactor-automation-template.js';
import { ExplainAutomationTemplate } from '../templates/explain-automation-template.js';

export class PromptTemplateEngine {
  private logger = createLogger('PromptTemplateEngine');
  private templates: Map<string, IPromptTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    this.registerTemplate(new GenerateAutomationTemplate());
    this.registerTemplate(new GenerateTaskTemplate());
    this.registerTemplate(new GenerateQuestionTemplate());
    this.registerTemplate(new GenerateInteractionTemplate());
    this.registerTemplate(new RefactorAutomationTemplate());
    this.registerTemplate(new ExplainAutomationTemplate());
  }

  registerTemplate(template: IPromptTemplate): void {
    const name = template.getName();
    this.templates.set(name, template);
  }

  getTemplate(templateType: string): IPromptTemplate {
    const template = this.templates.get(templateType);

    if (!template) {
      const available = Array.from(this.templates.keys()).join(', ');
      throw new TemplateError(`Template not found: ${templateType}. Available: ${available}`, {
        templateType,
        available
      });
    }

    return template;
  }

  getAllTemplates(): IPromptTemplate[] {
    return Array.from(this.templates.values());
  }

  hasTemplate(templateType: string): boolean {
    return this.templates.has(templateType);
  }

  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }
}
