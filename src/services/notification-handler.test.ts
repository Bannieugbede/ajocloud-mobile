import { safeDeepLink } from './notification-handler';

describe('safeDeepLink', () => {
  it('follows an in-app path', () => {
    expect(safeDeepLink({ deepLink: '/(tabs)/ajo' })).toBe('/(tabs)/ajo');
  });

  it('refuses an external URL', () => {
    // The link arrives from the server through Apple's and Google's
    // infrastructure; following it unchecked is an open redirect.
    expect(safeDeepLink({ deepLink: 'https://evil.test/steal' })).toBeNull();
    expect(safeDeepLink({ deepLink: '//evil.test/steal' })).toBeNull();
    expect(safeDeepLink({ deepLink: 'ajocloud://auth/google' })).toBeNull();
  });

  it('refuses a path outside the tab group', () => {
    expect(safeDeepLink({ deepLink: '/(auth)/sign-in' })).toBeNull();
    expect(safeDeepLink({ deepLink: '../secrets' })).toBeNull();
  });

  it('handles a payload with no link at all', () => {
    expect(safeDeepLink({})).toBeNull();
    expect(safeDeepLink(null)).toBeNull();
    expect(safeDeepLink(undefined)).toBeNull();
    expect(safeDeepLink({ deepLink: 42 })).toBeNull();
  });
});
