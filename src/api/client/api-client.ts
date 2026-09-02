import { environment } from '@/config/environment';
import type { AppError } from '@/types/errors';
import { restoreSession } from '@/services/session-storage';

import { normalizeHttpError, normalizeUnknownError } from './normalize-error';

export type AccessTokenProvider = () => Promise<string | null>;

/**
 * Requests are given 30 seconds. The backend's authentication endpoints have
 * been observed taking 6-12 seconds under load, so the previous 15 seconds
 * aborted responses that were still on their way and surfaced as a failure the
 * user could do nothing about.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  timeoutMs?: number;
  idempotencyKey?: string;
};

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: AccessTokenProvider = async () => null,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    // A caller-supplied signal used to replace ours, which silently disabled the
    // timeout for that request. Both are honoured now: either aborts the fetch.
    const callerSignal = options.signal;
    const onCallerAbort = () => controller.abort();
    callerSignal?.addEventListener('abort', onCallerAbort);

    try {
      const token = await this.getAccessToken();
      const headers = new Headers(options.headers);
      headers.set('Accept', 'application/json');
      if (options.body !== undefined) headers.set('Content-Type', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);

      const response = await fetch(new URL(path, this.baseUrl), {
        ...options,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      const payload: unknown =
        response.status === 204 ? undefined : await response.json().catch(() => undefined);
      if (!response.ok) {
        throw normalizeHttpError(
          response.status,
          payload,
          response.headers.get('x-request-id') ?? undefined,
        );
      }
      return payload as T;
    } catch (error) {
      if (isAppError(error)) throw error;
      throw normalizeUnknownError(error);
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', onCallerAbort);
    }
  }
}

function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'kind' in value && 'message' in value;
}

export const apiClient = environment.EXPO_PUBLIC_API_BASE_URL
  ? new ApiClient(
      environment.EXPO_PUBLIC_API_BASE_URL,
      async () => (await restoreSession())?.accessToken ?? null,
    )
  : null;
