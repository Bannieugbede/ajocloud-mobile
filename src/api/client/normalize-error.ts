import type { AppError, AppErrorKind } from '@/types/errors';

const statusKinds: Partial<Record<number, AppErrorKind>> = {
  401: 'authentication',
  403: 'authorization',
  404: 'not-found',
  409: 'conflict',
  422: 'validation',
  429: 'rate-limit',
  503: 'maintenance',
};

export function normalizeHttpError(status: number, payload?: unknown, traceId?: string): AppError {
  const record =
    typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
  const message =
    typeof record.message === 'string' ? record.message : 'The request could not be completed.';

  return {
    kind: statusKinds[status] ?? (status >= 500 ? 'server' : 'unknown'),
    message,
    status,
    code: typeof record.code === 'string' ? record.code : undefined,
    traceId,
    fieldErrors: isFieldErrors(record.errors) ? record.errors : undefined,
  };
}

export function normalizeUnknownError(error: unknown): AppError {
  if (error instanceof TypeError) {
    return { kind: 'network', message: 'Check your connection and try again.', cause: error };
  }
  return { kind: 'unknown', message: 'Something unexpected happened.', cause: error };
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      (item) => Array.isArray(item) && item.every((message) => typeof message === 'string'),
    )
  );
}
