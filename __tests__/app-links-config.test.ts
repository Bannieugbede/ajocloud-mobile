import appConfig from '../app.json';
import easConfig from '../eas.json';

/**
 * Universal links only work while three things agree: the domain the app
 * claims in app.json, the host the website (and so every shared invitation)
 * lives on, and the association file that host serves. The last one lives in
 * the web repository; these two live here and drift silently — a claimed
 * domain nobody links to opens nothing, and the failure is a browser tab
 * rather than an error.
 */

const expo = appConfig.expo as { ios: { associatedDomains?: string[] } };
const eas = easConfig as { build: Record<string, { env?: Record<string, string> }> };

const claimedHosts = (expo.ios.associatedDomains ?? []).map((entry) =>
  entry.replace(/^applinks:/, ''),
);

it('claims only applinks entries, since that is the only service configured', () => {
  expect(expo.ios.associatedDomains?.length).toBeGreaterThan(0);
  for (const entry of expo.ios.associatedDomains ?? []) {
    expect(entry).toMatch(/^applinks:[a-z0-9.-]+$/);
  }
});

describe.each(Object.entries(eas.build))('the %s profile', (_name, profile) => {
  it('builds against a web host the app claims', () => {
    const webUrl = profile.env?.EXPO_PUBLIC_WEB_URL;
    expect(webUrl).toBeDefined();
    expect(claimedHosts).toContain(new URL(webUrl as string).hostname);
  });
});
