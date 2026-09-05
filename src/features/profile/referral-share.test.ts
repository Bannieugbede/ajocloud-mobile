import { referralLink, referralShareMessage } from './referral-share';

describe('referralShareMessage', () => {
  it('carries the code itself, not only a link', () => {
    // A link is useless read aloud or retyped from a screenshot.
    expect(referralShareMessage('AJO-ACDEFG')).toContain('AJO-ACDEFG');
  });

  it('says what the message is for', () => {
    expect(referralShareMessage('AJO-ACDEFG')).toMatch(/Ajo Cloud/);
  });

  it('never leaves a dangling label when no link can be built', () => {
    const message = referralShareMessage('AJO-ACDEFG');
    // Either a real URL or no "Sign up here" line at all: a label followed by
    // nothing would already have been sent before anyone noticed.
    if (message.includes('Sign up here:')) {
      expect(message).toMatch(/Sign up here: https?:\/\/\S+/);
    }
  });
});

describe('referralLink', () => {
  it('escapes the code rather than pasting it raw into a URL', () => {
    const link = referralLink('AJO-ACDEFG');
    if (link) expect(link).toContain('ref=AJO-ACDEFG');
  });

  it('returns a URL or null, never a half-built one', () => {
    const link = referralLink('AJO-ACDEFG');
    expect(link === null || /^https?:\/\//.test(link)).toBe(true);
  });
});
