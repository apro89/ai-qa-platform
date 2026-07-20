/**
 * Error models for LLM provider operations.
 * Provides provider-independent error types.
 */

export type AIErrorType =
  | 'authentication'
  | 'rate_limit'
  | 'timeout'
  | 'network'
  | 'invalid_request'
  | 'server_error'
  | 'unknown';

export class AIError extends Error {
  constructor(
    public readonly type: AIErrorType,
    public readonly message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIError';
  }

  isRetryable(): boolean {
    return this.type === 'rate_limit' || this.type === 'timeout' || this.type === 'network';
  }
}

export class AuthenticationError extends AIError {
  constructor(message: string, provider: string, originalError?: unknown) {
    super('authentication', message, provider, undefined, originalError);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends AIError {
  constructor(
    public readonly retryAfter?: number,
    message: string = 'Rate limit exceeded',
    provider: string = 'unknown',
    originalError?: unknown
  ) {
    super('rate_limit', message, provider, 429, originalError);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AIError {
  constructor(message: string, provider: string, originalError?: unknown) {
    super('timeout', message, provider, undefined, originalError);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends AIError {
  constructor(message: string, provider: string, originalError?: unknown) {
    super('network', message, provider, undefined, originalError);
    this.name = 'NetworkError';
  }
}

export class InvalidRequestError extends AIError {
  constructor(message: string, provider: string, originalError?: unknown) {
    super('invalid_request', message, provider, 400, originalError);
    this.name = 'InvalidRequestError';
  }
}

export class ServerError extends AIError {
  constructor(message: string, provider: string, statusCode?: number, originalError?: unknown) {
    super('server_error', message, provider, statusCode, originalError);
    this.name = 'ServerError';
  }
}

export class UnsupportedProviderError extends AIError {
  constructor(provider: string) {
    super('unknown', `Unsupported LLM provider: ${provider}`, provider);
    this.name = 'UnsupportedProviderError';
  }
}
