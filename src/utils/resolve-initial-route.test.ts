import { resolveInitialRoute } from './resolve-initial-route';

const base = { authenticated: false, onboarded: false, verified: false, hasOrganization: false };

describe('resolveInitialRoute', () => {
  it('sends a first-run visitor to the introduction', () => {
    expect(resolveInitialRoute(base)).toBe('/(auth)/onboarding');
  });

  it('sends a returning signed-out visitor to sign in', () => {
    expect(resolveInitialRoute({ ...base, onboarded: true })).toBe('/(auth)/sign-in');
  });

  it('never shows the introduction to an authenticated user', () => {
    expect(
      resolveInitialRoute({
        authenticated: true,
        onboarded: false,
        verified: true,
        hasOrganization: true,
      }),
    ).toBe('/(tabs)/home');
  });
});
