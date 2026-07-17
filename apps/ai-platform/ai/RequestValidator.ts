import type { AIRequest } from './AIRequest.js';
import type { ProjectContext } from '../context/ProjectContext.js';
import type { Logger } from '../logger/Logger.js';

interface ValidationErrorDetail {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RequestValidator {
  constructor(private readonly logger: Logger) {}

  validateInput(input: {
    projectContext: ProjectContext;
    userRequest: string;
    templateType: string;
  }): void {
    const errors: ValidationErrorDetail[] = [];

    // Validate ProjectContext
    if (!input.projectContext) {
      errors.push({
        field: 'projectContext',
        message: 'ProjectContext is required',
        severity: 'error',
      });
    } else {
      if (!input.projectContext.framework) {
        errors.push({
          field: 'projectContext.framework',
          message: 'Framework is required',
          severity: 'error',
        });
      }
      if (!input.projectContext.architecture) {
        errors.push({
          field: 'projectContext.architecture',
          message: 'Architecture is required',
          severity: 'error',
        });
      }
    }

    // Validate userRequest
    if (!input.userRequest || input.userRequest.trim().length === 0) {
      errors.push({
        field: 'userRequest',
        message: 'User request cannot be empty',
        severity: 'error',
      });
    }
    if (input.userRequest && input.userRequest.length > 10000) {
      errors.push({
        field: 'userRequest',
        message: 'User request is too long (max 10000 characters)',
        severity: 'warning',
      });
    }

    // Validate templateType
    const validTemplates = [
      'GenerateAutomation',
      'GenerateTask',
      'GenerateQuestion',
      'GenerateInteraction',
      'RefactorAutomation',
      'ExplainCode',
    ];
    if (!validTemplates.includes(input.templateType)) {
      errors.push({
        field: 'templateType',
        message: `Invalid template type: ${input.templateType}`,
        severity: 'error',
      });
    }

    this.throwIfErrors(errors);
  }

  validateRequest(request: AIRequest): void {
    const errors: ValidationErrorDetail[] = [];

    // Validate required fields
    if (!request.requestId) {
      errors.push({
        field: 'requestId',
        message: 'Request ID is missing',
        severity: 'error',
      });
    }
    if (!request.objective) {
      errors.push({
        field: 'objective',
        message: 'Objective is missing',
        severity: 'error',
      });
    }
    if (!request.systemInstructions || request.systemInstructions.length === 0) {
      errors.push({
        field: 'systemInstructions',
        message: 'At least one system instruction is required',
        severity: 'error',
      });
    }
    if (!request.expectedOutput) {
      errors.push({
        field: 'expectedOutput',
        message: 'Expected output specification is missing',
        severity: 'error',
      });
    }

    this.throwIfErrors(errors);
  }

  private throwIfErrors(errors: ValidationErrorDetail[]): void {
    const criticalErrors = errors.filter((e) => e.severity === 'error');
    if (criticalErrors.length > 0) {
      const errorMessage = `Validation failed: ${criticalErrors.map((e) => e.message).join('; ')}`;
      this.logger.error(errorMessage, undefined, {});
      throw new ValidationError(errorMessage);
    }

    const warnings = errors.filter((e) => e.severity === 'warning');
    if (warnings.length > 0) {
      this.logger.warn('Validation warnings');
    }
  }
}
