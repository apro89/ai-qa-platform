/**
 * PromptRenderingError
 *
 * Base error class for prompt rendering operations.
 */

export class PromptRenderingError extends Error {
  name = 'PromptRenderingError';

  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    Object.setPrototypeOf(this, PromptRenderingError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}

/**
 * TemplateError - template not found or invalid
 */
export class TemplateError extends PromptRenderingError {
  name = 'TemplateError';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TEMPLATE_ERROR', context);
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

/**
 * ValidationError - validation failed
 */
export class ValidationError extends PromptRenderingError {
  name = 'ValidationError';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * TokenBudgetError - exceeded token budget
 */
export class TokenBudgetError extends PromptRenderingError {
  name = 'TokenBudgetError';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TOKEN_BUDGET_ERROR', context);
    Object.setPrototypeOf(this, TokenBudgetError.prototype);
  }
}

/**
 * FormattingError - error during text formatting
 */
export class FormattingError extends PromptRenderingError {
  name = 'FormattingError';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FORMATTING_ERROR', context);
    Object.setPrototypeOf(this, FormattingError.prototype);
  }
}

/**
 * RenderingError - general rendering error
 */
export class RenderingError extends PromptRenderingError {
  name = 'RenderingError';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'RENDERING_ERROR', context);
    Object.setPrototypeOf(this, RenderingError.prototype);
  }
}
