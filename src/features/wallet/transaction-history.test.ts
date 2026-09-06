import type { WalletTransaction } from '@/api/endpoints/wallets';

import {
  categoryOf,
  filterMovements,
  isMoneyIn,
  matchesFilter,
  movementTimeLabel,
  settledTotals,
  signedAmountLabel,
} from './transaction-history';

function movement(overrides: {
  id?: string;
  direction?: 'DEBIT' | 'CREDIT';
  amountMinor?: string;
  description?: string;
  status?: string;
  postedAt?: string | null;
  createdAt?: string;
}): WalletTransaction {
  return {
    id: overrides.id ?? 't1',
    direction: overrides.direction ?? 'CREDIT',
    amountMinor: overrides.amountMinor ?? '5000000',
    currency: 'NGN',
    createdAt: overrides.createdAt ?? '2026-07-15T10:32:00.000Z',
    transaction: {
      reference: `ref-${overrides.id ?? 't1'}`,
      description: overrides.description ?? 'Wallet Funded',
      status: overrides.status ?? 'SUCCESSFUL',
      postedAt: overrides.postedAt === undefined ? '2026-07-15T10:32:00.000Z' : overrides.postedAt,
    },
  };
}

describe('categoryOf', () => {
  it('files each product by its description', () => {
    expect(categoryOf(movement({ description: 'Wallet Funded' }))).toBe('wallet');
    expect(categoryOf(movement({ description: 'Eko Savings Circle Ajo Contribution' }))).toBe(
      'ajo',
    );
    expect(categoryOf(movement({ description: 'DSTV Subscription' }))).toBe('bill');
    expect(categoryOf(movement({ description: 'MTN Airtime' }))).toBe('bill');
    expect(categoryOf(movement({ description: 'Akawo pool due' }))).toBe('akawo');
  });

  it('reads Food Ajo as food, not as a rotating Ajo payment', () => {
    // "Food Ajo" contains "Ajo". Tested before the Ajo branch on purpose: a
    // food package filed under Ajo would put the wrong icon on the row and
    // group it with contributions it has nothing to do with.
    expect(categoryOf(movement({ description: 'Basic Family Package Food Ajo' }))).toBe('food');
  });

  it('files an unrecognised movement rather than dropping it', () => {
    // A movement nobody anticipated is still the member's money and must list.
    expect(categoryOf(movement({ description: 'Something new entirely' }))).toBe('other');
  });
});

describe('direction', () => {
  it('treats a credit as money in and a debit as money out', () => {
    expect(isMoneyIn(movement({ direction: 'CREDIT' }))).toBe(true);
    expect(isMoneyIn(movement({ direction: 'DEBIT' }))).toBe(false);
  });

  it('signs the amount the way it is read', () => {
    expect(signedAmountLabel(movement({ direction: 'CREDIT' }), '₦50,000.00')).toBe('+₦50,000.00');
    expect(signedAmountLabel(movement({ direction: 'DEBIT' }), '₦25,000.00')).toBe('−₦25,000.00');
  });
});

describe('filters', () => {
  const all = [
    movement({ id: 'a', direction: 'CREDIT' }),
    movement({ id: 'b', direction: 'DEBIT' }),
    movement({ id: 'c', direction: 'CREDIT' }),
  ];

  it('shows everything under All', () => {
    expect(filterMovements(all, 'all')).toHaveLength(3);
  });

  it('separates money in from money out', () => {
    expect(filterMovements(all, 'in').map((m) => m.id)).toEqual(['a', 'c']);
    expect(filterMovements(all, 'out').map((m) => m.id)).toEqual(['b']);
  });

  it('handles a history that has not loaded', () => {
    expect(filterMovements(undefined, 'all')).toEqual([]);
  });

  it('agrees with matchesFilter for every movement', () => {
    for (const entry of all) {
      expect(matchesFilter(entry, 'all')).toBe(true);
      expect(matchesFilter(entry, 'in')).toBe(isMoneyIn(entry));
      expect(matchesFilter(entry, 'out')).toBe(!isMoneyIn(entry));
    }
  });
});

describe('settledTotals', () => {
  it('totals each direction separately', () => {
    const totals = settledTotals([
      movement({ id: 'a', direction: 'CREDIT', amountMinor: '5000000' }),
      movement({ id: 'b', direction: 'CREDIT', amountMinor: '30000000' }),
      movement({ id: 'c', direction: 'DEBIT', amountMinor: '2500000' }),
    ]);
    expect(totals).toEqual({ inMinor: '35000000', outMinor: '2500000' });
  });

  it('counts only money that actually moved', () => {
    // A pending credit has not arrived and a failed one never will. Adding
    // either to "total in" would tell someone they have been paid when the
    // money is not there.
    const totals = settledTotals([
      movement({ id: 'a', direction: 'CREDIT', amountMinor: '5000000' }),
      movement({ id: 'b', direction: 'CREDIT', amountMinor: '9900000', status: 'PENDING' }),
      movement({ id: 'c', direction: 'CREDIT', amountMinor: '8800000', status: 'FAILED' }),
      movement({ id: 'd', direction: 'DEBIT', amountMinor: '7700000', status: 'PENDING' }),
    ]);
    expect(totals).toEqual({ inMinor: '5000000', outMinor: '0' });
  });

  it('does not care how the ledger cases its status', () => {
    const totals = settledTotals([
      movement({ direction: 'CREDIT', amountMinor: '5000000', status: 'successful' }),
    ]);
    expect(totals.inMinor).toBe('5000000');
  });

  it('stays exact for amounts beyond a safe integer', () => {
    // Minor units are strings because a balance can exceed 2^53; summing in
    // floating point would round someone's total.
    const totals = settledTotals([
      movement({ id: 'a', direction: 'CREDIT', amountMinor: '9007199254740993' }),
      movement({ id: 'b', direction: 'CREDIT', amountMinor: '1' }),
    ]);
    expect(totals.inMinor).toBe('9007199254740994');
  });

  it('totals nothing before the history loads', () => {
    expect(settledTotals(undefined)).toEqual({ inMinor: '0', outMinor: '0' });
  });
});

describe('movementTimeLabel', () => {
  it('prefers when the money posted over when the entry was made', () => {
    const label = movementTimeLabel(
      movement({ createdAt: '2026-07-01T00:00:00.000Z', postedAt: '2026-07-15T10:32:00.000Z' }),
    );
    expect(label).toMatch(/15/);
    expect(label).not.toMatch(/Jul 1,/);
  });

  it('falls back to the created time when nothing has posted', () => {
    expect(
      movementTimeLabel(movement({ createdAt: '2026-07-15T10:32:00.000Z', postedAt: null })),
    ).toMatch(/15/);
  });

  it('says the date is unavailable rather than rendering "Invalid Date"', () => {
    expect(movementTimeLabel(movement({ postedAt: 'not-a-date' }))).toBe('Date unavailable');
  });
});
