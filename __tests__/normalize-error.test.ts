import { normalizeHttpError, normalizeUnknownError } from '@/api/client/normalize-error';

it('normalizes backend and network errors', () => {
  expect(
    normalizeHttpError(422, { message: 'Invalid', errors: { email: ['Used'] } }),
  ).toMatchObject({
    kind: 'validation',
    fieldErrors: { email: ['Used'] },
  });
  expect(normalizeUnknownError(new TypeError('offline')).kind).toBe('network');
  expect(
    normalizeHttpError(429, {
      error: { code: 'HTTP_429', message: 'Try again later', requestId: 'request-1' },
    }),
  ).toMatchObject({
    kind: 'rate-limit',
    code: 'HTTP_429',
    message: 'Try again later',
    traceId: 'request-1',
  });
});

it('reports an aborted request as a timeout rather than an unknown failure', () => {
  // React Native aborts with a DOMException named AbortError, which is not a
  // TypeError; treating it as one left the user with "something unexpected".
  const abort = Object.assign(new Error('Aborted'), { name: 'AbortError' });
  const normalized = normalizeUnknownError(abort);

  expect(normalized.kind).toBe('timeout');
  expect(normalized.message).toMatch(/took too long/i);
});

it('still reports a genuinely unknown failure as unknown', () => {
  expect(normalizeUnknownError(new Error('boom')).kind).toBe('unknown');
});
