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
