import { chargesAnything, feeAmountLabel, FEE_LINES } from './platform-fees';

describe('platform fees', () => {
  it('reports that nothing is charged while every line is free', () => {
    // The summary line and the table are driven from the same data, so the
    // screen cannot claim fees are free above a table that lists a charge.
    expect(chargesAnything()).toBe(false);
  });

  it('reports a charge as soon as one line has an amount', () => {
    expect(
      chargesAnything([{ product: 'Ajo', name: 'Payout', amount: '₦100', detail: 'Per payout.' }]),
    ).toBe(true);
  });

  it('labels a line with no amount as free rather than blank', () => {
    expect(feeAmountLabel({ product: 'Ajo', name: 'Payout', amount: null, detail: '' })).toBe(
      'Free',
    );
  });

  it('labels a line that has an amount with that amount', () => {
    expect(feeAmountLabel({ product: 'Ajo', name: 'Payout', amount: '₦100', detail: '' })).toBe(
      '₦100',
    );
  });

  it('covers every product a member can be charged for', () => {
    // A missing product reads as "no fee" when it may simply have been
    // forgotten, which is the more damaging of the two mistakes.
    const products = new Set(FEE_LINES.map((line) => line.product));
    expect(products).toEqual(new Set(['Ajo', 'Akawo', 'Food Ajo', 'Bills', 'Wallet']));
  });

  it('gives every line an explanation, not just a price', () => {
    for (const line of FEE_LINES) {
      expect(line.detail.length).toBeGreaterThan(0);
    }
  });
});
