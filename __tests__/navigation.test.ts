import { resolveInitialRoute } from '@/utils/resolve-initial-route';

it('does not route an unauthenticated user into protected screens', () => {
  expect(
    resolveInitialRoute({
      authenticated: false,
      verified: true,
      hasOrganization: true,
    }),
  ).toBe('/(auth)/welcome');
});

it('routes an authenticated, verified user directly to the app', () => {
  expect(
    resolveInitialRoute({
      authenticated: true,
      verified: true,
      hasOrganization: true,
    }),
  ).toBe('/(tabs)/home');
});
