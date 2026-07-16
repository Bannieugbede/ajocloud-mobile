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
  const errorRecord =
    typeof record.error === 'object' && record.error !== null
      ? (record.error as Record<string, unknown>)
      : record;
  const rawMessage = errorRecord.message;
  const message =
    typeof rawMessage === 'string'
      ? rawMessage
      : Array.isArray(rawMessage) && rawMessage.every((item) => typeof item === 'string')
        ? rawMessage.join(' ')
        : 'The request could not be completed.';

  return {
    kind: statusKinds[status] ?? (status >= 500 ? 'server' : 'unknown'),
    message,
    status,
    code: typeof errorRecord.code === 'string' ? errorRecord.code : undefined,
    traceId: typeof errorRecord.requestId === 'string' ? errorRecord.requestId : traceId,
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
