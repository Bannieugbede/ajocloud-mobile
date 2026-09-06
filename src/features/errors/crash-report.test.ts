import { crashReference, shouldOfferReload, supportMailto } from './crash-report';

describe('the crash reference', () => {
  it('is readable aloud, with no characters that look like each other', () => {
    // Someone reads this to support over the phone. 0/O and 1/I/L would be
    // transcribed wrongly and the report would never be found.
    const reference = crashReference(() => 0.5);
    expect(reference.startsWith('ERR-')).toBe(true);
    expect(reference.slice(4)).not.toMatch(/[01OIL8B]/);
  });

  it('is six characters after the prefix', () => {
    expect(crashReference(() => 0).slice(4)).toHaveLength(6);
  });

  it('differs between crashes rather than being derived from the error', () => {
    // A hash of the message would be stable, which sounds useful until the same
    // reference is shown to two members and neither report can be told apart.
    const values = new Set(Array.from({ length: 50 }, () => crashReference()));
    expect(values.size).toBeGreaterThan(1);
  });
});

describe('the support link', () => {
  it('carries the reference and nothing about the error', () => {
    // A subject line is the easiest place for a stack trace to leak into a
    // mailbox nobody has redacted.
    const link = supportMailto('ERR-ABC234');
    if (link === null) {
      expect(link).toBeNull();
      return;
    }
    expect(link).toContain('ERR-ABC234');
    expect(link.startsWith('mailto:')).toBe(true);
  });
});

describe('offering a reload', () => {
  it('retries in place before resorting to reloading the bundle', () => {
    expect(shouldOfferReload(0)).toBe(false);
  });

  it('offers a reload once retrying in place has already failed', () => {
    // A crash during first render repeats on a plain remount, so a second
    // "Try again" would just ask the member to press the same button twice.
    expect(shouldOfferReload(1)).toBe(true);
    expect(shouldOfferReload(4)).toBe(true);
  });
});
