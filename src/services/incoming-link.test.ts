import { invitationCodeFromUrl, isPlausibleInvitationCode } from './incoming-link';

// A realistic code: 32 random bytes rendered as base64url, as the API issues.
const CODE = 'q7Xv3nRk2LpZ8sWt4YbG1mHc6dJfN0uA9eKiOxPzQrE';

describe('invitationCodeFromUrl', () => {
  it('reads a code from the app’s own scheme', () => {
    expect(invitationCodeFromUrl(`ajocloud://join/${CODE}`)).toBe(CODE);
  });

  it('reads a code from the website link someone without the app lands on', () => {
    expect(invitationCodeFromUrl(`https://ajocloud.com/join/${CODE}`)).toBe(CODE);
  });

  it('ignores a query string appended to the link', () => {
    expect(invitationCodeFromUrl(`https://ajocloud.com/join/${CODE}?utm_source=whatsapp`)).toBe(
      CODE,
    );
  });

  it.each([
    ['a link to somewhere else entirely', `https://evil.example.com/pay/${CODE}`],
    ['a link with no code after join', 'ajocloud://join'],
    ['a link with an empty code', 'ajocloud://join/'],
    ['a bare scheme', 'ajocloud://'],
    ['an unrelated path', `ajocloud://groups/${CODE}`],
    ['nonsense', 'not a url at all'],
    ['an empty string', ''],
  ])('returns null for %s', (_label, url) => {
    expect(invitationCodeFromUrl(url)).toBeNull();
  });

  it('refuses a code carrying path traversal', () => {
    // The code is interpolated into an API path, so anything that could climb
    // out of it must be rejected before it gets there.
    expect(invitationCodeFromUrl('ajocloud://join/..%2F..%2Fadmin')).toBeNull();
  });

  it('refuses a code that is too short to be one the API issued', () => {
    expect(invitationCodeFromUrl('ajocloud://join/abc123')).toBeNull();
  });

  it('refuses an implausibly long code rather than passing it on', () => {
    expect(invitationCodeFromUrl(`ajocloud://join/${'a'.repeat(500)}`)).toBeNull();
  });
});

describe('isPlausibleInvitationCode', () => {
  it('accepts the base64url alphabet the API issues', () => {
    expect(isPlausibleInvitationCode(CODE)).toBe(true);
    expect(isPlausibleInvitationCode('a-b_c'.padEnd(40, 'x'))).toBe(true);
  });

  it.each([
    ['too short', 'abc'],
    ['a slash', `${'a'.repeat(31)}/x`],
    ['a dot', `${'a'.repeat(31)}.x`],
    ['a space', `${'a'.repeat(31)} x`],
    ['a percent escape', `${'a'.repeat(31)}%2F`],
  ])('rejects %s', (_label, code) => {
    expect(isPlausibleInvitationCode(code)).toBe(false);
  });
});

describe('host handling', () => {
  it('accepts a link whose join segment is at the root of the site', () => {
    expect(invitationCodeFromUrl(`https://ajocloud.com/join/${CODE}`)).toBe(CODE);
  });

  it('refuses a scheme link with a host-like first segment', () => {
    // ajocloud://ajocloud.com/join/CODE reads as host + path under the scheme
    // form, which would put join second. It is not a link the app issues.
    expect(invitationCodeFromUrl(`ajocloud://somehost/join/${CODE}`)).toBeNull();
  });

  it('refuses a relative path with no scheme at all', () => {
    expect(invitationCodeFromUrl(`/join/${CODE}`)).toBeNull();
  });

  it('refuses a join segment buried under another path', () => {
    // Only /join/<code> is the invitation route. Matching "join" anywhere would
    // accept a link some other site can mint, and the code would then be sent
    // to the API as though the user had been invited.
    expect(invitationCodeFromUrl(`https://evil.example.com/x/join/${CODE}`)).toBeNull();
  });
});
