import { formatMinorAmount, sumMinorAmounts } from '@/utils/money';

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
