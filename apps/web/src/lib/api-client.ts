import type { ApiErrorBody, ErrorCode } from '@courtly/shared';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const isApiErrorBody = (body: unknown): body is ApiErrorBody =>
  typeof body === 'object' && body !== null && 'error' in body;

const parseBody = (text: string): unknown => {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

type Method = 'GET' | 'POST' | 'PATCH';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const hasBody = method !== 'GET';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'same-origin',
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(body ?? {}) : undefined,
  });

  const payload = parseBody(await res.text());
  if (!res.ok) {
    if (isApiErrorBody(payload)) {
      const { code, message, details } = payload.error;
      throw new ApiError(res.status, code, message, details);
    }
    throw new ApiError(res.status, 'INTERNAL_ERROR', 'Something went wrong');
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
};

export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
