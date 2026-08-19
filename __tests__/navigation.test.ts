import { resolveInitialRoute } from '@/utils/resolve-initial-route';

it('does not route an unauthenticated user into protected screens', () => {
  expect(
    resolveInitialRoute({
      authenticated: false,
      onboarded: true,
      verified: true,
      hasOrganization: true,
    }),
  ).toBe('/(auth)/sign-in');
});

it('sends an unauthenticated first-run visitor to the introduction', () => {
  expect(
    resolveInitialRoute({
      authenticated: false,
      onboarded: false,
      verified: true,
      hasOrganization: true,
    }),
  ).toBe('/(auth)/onboarding');
});

it('routes an authenticated, verified user directly to the app', () => {
  expect(
    resolveInitialRoute({
      authenticated: true,
      onboarded: true,
      verified: true,
      hasOrganization: true,
    }),
  ).toBe('/(tabs)/home');
});
