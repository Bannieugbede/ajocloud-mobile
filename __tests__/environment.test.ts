import { parseEnvironment } from '@/config/environment';

it('validates public environment configuration', () => {
  expect(parseEnvironment({ EXPO_PUBLIC_APP_ENV: 'preview' }).EXPO_PUBLIC_APP_ENV).toBe('preview');
  expect(() => parseEnvironment({ EXPO_PUBLIC_API_BASE_URL: 'secret' })).toThrow();
});
