import easConfig from '../eas.json';
import { environmentSchema } from '@/config/environment';

/**
 * eas.json is not typechecked and not exercised by any other test, so a
 * mistake in it surfaces as a build that succeeds and an app that is pointed
 * at nothing. A missing EXPO_PUBLIC_API_BASE_URL in particular leaves
 * `apiClient` null and every request throwing "API configuration is
 * unavailable" — on a shipped binary, where it cannot be corrected without
 * another build.
 */

type BuildProfile = { environment?: string; env?: Record<string, string> };

const eas = easConfig as { build: Record<string, BuildProfile> };

const profiles = Object.entries(eas.build);

/** Every key the app reads. A profile omitting one builds an app without it. */
const REQUIRED_KEYS = Object.keys(environmentSchema.shape);

it('defines the three build profiles the app ships from', () => {
  expect(Object.keys(eas.build).sort()).toEqual(['development', 'preview', 'production']);
});

describe.each(profiles)('the %s profile', (name, profile) => {
  it('supplies an environment the app can parse', () => {
    expect(() => environmentSchema.parse(profile.env)).not.toThrow();
  });

  it('sets every variable the app reads', () => {
    // Zod treats these as optional, so an omission would parse cleanly and
    // fail only once someone opened the screen that needed it.
    expect(Object.keys(profile.env ?? {}).sort()).toEqual([...REQUIRED_KEYS].sort());
  });

  it('points at an API, since a build without one cannot talk to anything', () => {
    expect(profile.env?.EXPO_PUBLIC_API_BASE_URL).toMatch(/^https:\/\//);
  });

  it('agrees with itself about which environment it is', () => {
    // EXPO_PUBLIC_APP_ENV is what the app branches on; `environment` is what
    // EAS resolves server-side variables from. Two names for one idea, and a
    // preview build reporting itself as production would mislead every log.
    expect(profile.env?.EXPO_PUBLIC_APP_ENV).toBe(name);
    expect(profile.environment).toBe(name);
  });
});
