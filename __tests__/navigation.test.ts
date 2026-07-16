import { resolveInitialRoute } from '@/utils/resolve-initial-route';

it('does not route an unauthenticated user into protected screens', () => {
  expect(
    resolveInitialRoute({
      authenticated: false,
      onboardingComplete: true,
      verified: true,
      hasOrganization: true,
    }),
  ).toBe('/(auth)/welcome');
});
