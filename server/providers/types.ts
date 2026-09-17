export class RateLimitError extends Error {
  statusCode = 429;
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AuthError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ProviderError extends Error {
  statusCode: number;
  retryable: boolean;
  constructor(message: string, statusCode = 500, retryable = false) {
    super(message);
    this.name = 'ProviderError';
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

export interface ProviderCallParams {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  customBaseUrl?: string;
  customAuthHeader?: string;
}

export interface ProviderCallResult {
  content: string;
  tokensUsed: number;
  model: string;
  latencyMs: number;
  streamResponse?: ReadableStream | NodeJS.ReadableStream | any;
}
