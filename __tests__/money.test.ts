import { formatMinorAmount, majorToMinor, minorToMajor, sumMinorAmounts } from '@/utils/money';

describe('formatMinorAmount', () => {
  it('formats Naira minor units with grouping and two decimals', () => {
    expect(formatMinorAmount('0')).toBe('₦0.00');
    expect(formatMinorAmount('999')).toBe('₦9.99');
    expect(formatMinorAmount('1234567')).toBe('₦12,345.67');
  });

  it('stays exact above Number.MAX_SAFE_INTEGER', () => {
    // A 1,000-member group pooling large sums exceeds the safe-integer range, so
    // the formatter must never route the value through a double.
    expect(formatMinorAmount('9007199254740993')).toBe('₦90,071,992,547,409.93');
    expect(formatMinorAmount('100000000000000000000')).toBe('₦1,000,000,000,000,000,000.00');
  });

  it('keeps the sign outside the currency symbol', () => {
    expect(formatMinorAmount('-250050')).toBe('-₦2,500.50');
  });

  it('falls back to a readable placeholder for unusable input', () => {
    expect(formatMinorAmount('not-a-number')).toBe('NGN —');
    expect(formatMinorAmount('12.5')).toBe('NGN —');
  });

  it('supports other currencies, symbol-less when unknown', () => {
    expect(formatMinorAmount('12345', 'USD')).toBe('$123.45');
    expect(formatMinorAmount('50000', 'XAF')).toBe('XAF 500.00');
  });
});

describe('sumMinorAmounts', () => {
  it('adds minor units exactly and ignores unusable entries', () => {
    expect(sumMinorAmounts(['1000', '2500', '99'])).toBe('3599');
    expect(sumMinorAmounts(['9007199254740993', '1'])).toBe('9007199254740994');
    expect(sumMinorAmounts([])).toBe('0');
    expect(sumMinorAmounts(['1000', 'bad'])).toBe('1000');
  });
});

describe('minorToMajor', () => {
  it('is the inverse of majorToMinor for whole amounts', () => {
    expect(minorToMajor('2500000')).toBe('25000');
    expect(minorToMajor('50000')).toBe('500');
  });

  it('keeps kobo when there are any', () => {
    expect(minorToMajor('2500050')).toBe('25000.50');
  });

  it('drops a trailing .00, which nobody types', () => {
    expect(minorToMajor('100')).toBe('1');
  });

  it('handles amounts smaller than one naira', () => {
    expect(minorToMajor('5')).toBe('0.05');
    expect(minorToMajor('50')).toBe('0.50');
  });

  it('round-trips through majorToMinor', () => {
    // The pair has to agree, or prefilling a field would change the amount.
    for (const minor of ['2500000', '50000', '2500050', '100', '5']) {
      expect(majorToMinor(minorToMajor(minor))).toBe(minor);
    }
  });

  it('returns nothing for a value that is not minor units', () => {
    expect(minorToMajor('abc')).toBe('');
    expect(minorToMajor('')).toBe('');
  });
});
