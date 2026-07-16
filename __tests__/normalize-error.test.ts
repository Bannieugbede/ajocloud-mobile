import { normalizeHttpError, normalizeUnknownError } from '@/api/client/normalize-error';

it('normalizes backend and network errors', () => {
  expect(
    normalizeHttpError(422, { message: 'Invalid', errors: { email: ['Used'] } }),
  ).toMatchObject({
    kind: 'validation',
    fieldErrors: { email: ['Used'] },
  });
  expect(normalizeUnknownError(new TypeError('offline')).kind).toBe('network');
});
