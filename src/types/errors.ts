export type AppErrorKind =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'rate-limit'
  | 'server'
  | 'maintenance'
  | 'unknown';

export type AppError = {
  kind: AppErrorKind;
  message: string;
  status?: number;
  code?: string;
  traceId?: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
  cause?: unknown;
};
