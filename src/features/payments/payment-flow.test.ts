import {
  intentKey,
  partAmountMessage,
  partAmountProblem,
  topUpForShortfallMinor,
  walletShortfallMinor,
} from './payment-flow';

describe('walletShortfallMinor', () => {
  it('is how far the balance is from the total', () => {
    expect(walletShortfallMinor('100000', '505000')).toBe('405000');
  });

  it('is nothing when the balance exactly covers it', () => {
    expect(walletShortfallMinor('505000', '505000')).toBeNull();
  });

  it('is unknown, not zero, before the balance has loaded', () => {
    // Treating an unloaded balance as empty would tell everyone they are short.
    expect(walletShortfallMinor(undefined, '505000')).toBeNull();
  });

  it('keeps precision beyond what a Number holds', () => {
    expect(walletShortfallMinor('1', '90071992547409930')).toBe('90071992547409929');
  });
});

describe('topUpForShortfallMinor', () => {
  it('offers exactly the shortfall when it is above the minimum top-up', () => {
    expect(topUpForShortfallMinor('405000')).toBe('405000');
  });

  it('never offers less than the server accepts', () => {
    // ₦50 short would otherwise be sent to a top-up the server refuses.
    expect(topUpForShortfallMinor('5000')).toBe('50000');
  });
});

describe('partAmountProblem', () => {
  it.each([
    ['', 'empty'],
    ['abc', 'invalid'],
    ['0', 'zero'],
    ['5000.01', 'too-much'],
  ] as const)('%p is %s', (typed, problem) => {
    expect(partAmountProblem(typed, '500000')).toBe(problem);
  });

  it.each(['1', '2500', '5000', ' 5000 '])('accepts %p of ₦5,000', (typed) => {
    expect(partAmountProblem(typed, '500000')).toBeNull();
  });

  it('stays quiet about an empty field', () => {
    expect(partAmountMessage('empty', '₦5,000.00')).toBeNull();
    expect(partAmountMessage('too-much', '₦5,000.00')).toBe(
      'That is more than the ₦5,000.00 still owed.',
    );
  });
});

describe('intentKey', () => {
  it('is the same for a retried request, so the server returns the same intent', () => {
    expect(intentKey('flow-1', '150000')).toBe(intentKey('flow-1', '150000'));
  });

  it('differs for a different amount, which needs its own intent', () => {
    expect(intentKey('flow-1', '150000')).not.toBe(intentKey('flow-1', null));
  });

  it('differs between flows, so a new payment never reuses an old intent', () => {
    expect(intentKey('flow-1', null)).not.toBe(intentKey('flow-2', null));
  });

  it('fits the server’s 8 to 128 character limit', () => {
    const key = intentKey('mfx9k2-12', '90071992547409930');
    expect(key.length).toBeGreaterThanOrEqual(8);
    expect(key.length).toBeLessThanOrEqual(128);
  });
});
