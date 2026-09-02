import type { BillProduct } from '@/api/endpoints/bill-payments';
import {
  amountError,
  billOutcome,
  shouldPollBill,
  canAfford,
  isFixedAmount,
  isValidationCurrent,
  referenceLabel,
  resolveAmountMinor,
} from './bill-amount';

const base: BillProduct = {
  id: 'p1',
  providerCode: 'DEV',
  name: 'Product',
  minimumMinor: null,
  maximumMinor: null,
  fixedAmountMinor: null,
  currency: 'NGN',
};

const fixed: BillProduct = { ...base, fixedAmountMinor: '50000' };
const bounded: BillProduct = { ...base, minimumMinor: '10000', maximumMinor: '5000000' };

describe('isFixedAmount', () => {
  it('recognises a biller-decided amount', () => {
    expect(isFixedAmount(fixed)).toBe(true);
  });

  it('treats an open product as payer-decided', () => {
    expect(isFixedAmount(base)).toBe(false);
    expect(isFixedAmount(null)).toBe(false);
  });
});

describe('amountError', () => {
  it('accepts any positive amount for an unbounded product', () => {
    expect(amountError(base, '123456')).toBeNull();
  });

  it('requires an amount at all', () => {
    expect(amountError(base, null)).toMatch(/Enter an amount/i);
  });

  it('refuses anything but the fixed amount, and says what it is', () => {
    // The backend returns "Amount must match the product fixed amount"; the
    // user needs the figure, not the rule.
    expect(amountError(fixed, '40000')).toMatch(/exactly ₦500\.00/);
  });

  it('accepts the fixed amount exactly', () => {
    expect(amountError(fixed, '50000')).toBeNull();
  });

  it('refuses below the minimum', () => {
    expect(amountError(bounded, '9999')).toMatch(/least you can pay/i);
  });

  it('accepts the minimum itself', () => {
    expect(amountError(bounded, '10000')).toBeNull();
  });

  it('refuses above the maximum', () => {
    expect(amountError(bounded, '5000001')).toMatch(/most you can pay/i);
  });

  it('accepts the maximum itself', () => {
    expect(amountError(bounded, '5000000')).toBeNull();
  });

  it('stays exact far above the safe integer range', () => {
    const huge = (10n ** 20n).toString();
    expect(amountError({ ...base, maximumMinor: huge }, huge)).toBeNull();
    expect(
      amountError({ ...base, maximumMinor: huge }, (10n ** 20n + 1n).toString()),
    ).not.toBeNull();
  });
});

describe('resolveAmountMinor', () => {
  it('uses the biller’s amount for a fixed product, ignoring the field', () => {
    // A stale field must not submit a figure the backend would reject.
    expect(resolveAmountMinor(fixed, '999')).toBe('50000');
  });

  it('converts what the user typed for an open product', () => {
    expect(resolveAmountMinor(base, '1,500.50')).toBe('150050');
  });

  it('returns null for an unpayable entry', () => {
    expect(resolveAmountMinor(base, '0')).toBeNull();
    expect(resolveAmountMinor(base, 'abc')).toBeNull();
  });
});

describe('canAfford', () => {
  it('allows a balance that exactly covers the amount', () => {
    expect(canAfford('50000', '50000')).toBe(true);
  });

  it('refuses one minor unit short', () => {
    expect(canAfford('49999', '50000')).toBe(false);
  });

  it('does not block while the balance is unknown', () => {
    // The backend checks funds anyway; guessing "no" here would hide the button
    // for someone who can actually pay.
    expect(canAfford(null, '50000')).toBe(true);
  });
});

describe('isValidationCurrent', () => {
  const now = new Date('2026-09-02T10:00:00.000Z');

  it('accepts a validation that has not expired', () => {
    expect(isValidationCurrent('2026-09-02T10:05:00.000Z', now)).toBe(true);
  });

  it('treats the expiry instant as expired', () => {
    expect(isValidationCurrent('2026-09-02T10:00:00.000Z', now)).toBe(false);
  });

  it('refuses an unparseable expiry rather than assuming it is valid', () => {
    expect(isValidationCurrent('not-a-date', now)).toBe(false);
  });
});

describe('referenceLabel', () => {
  it.each([
    ['Airtime', 'Phone number'],
    ['Electricity', 'Meter number'],
    ['Cable TV', 'Smartcard number'],
    ['Water', 'Account number'],
  ])('names the field for %s', (category, expected) => {
    expect(referenceLabel(category)).toBe(expected);
  });

  it('falls back to a neutral label for an unknown category', () => {
    expect(referenceLabel('Something else')).toBe('Customer reference');
    expect(referenceLabel(undefined)).toBe('Customer reference');
  });
});

describe('billOutcome', () => {
  it('reports a completed payment', () => {
    expect(billOutcome('SUCCESSFUL')).toBe('succeeded');
  });

  it.each(['FAILED', 'REVERSED', 'REFUNDED'])('reports %s as failed', (status) => {
    expect(billOutcome(status)).toBe('failed');
  });

  it.each(['CREATED', 'VALIDATING', 'VALIDATED', 'PENDING', 'PROCESSING', 'REFUND_PENDING'])(
    'reports %s as still in flight',
    (status) => {
      expect(billOutcome(status)).toBe('pending');
    },
  );

  it('keeps RECONCILIATION_REQUIRED separate from success and failure', () => {
    // The wallet was debited but the provider's result is unknown. Calling it
    // failed would be wrong; calling it successful would be worse.
    expect(billOutcome('RECONCILIATION_REQUIRED')).toBe('unresolved');
  });

  it('treats an unrecognised status as still in flight rather than done', () => {
    expect(billOutcome('SOMETHING_NEW')).toBe('pending');
  });
});

describe('shouldPollBill', () => {
  it('polls while the payment is in flight', () => {
    expect(shouldPollBill('PROCESSING')).toBe(true);
  });

  it.each(['SUCCESSFUL', 'FAILED', 'RECONCILIATION_REQUIRED'])(
    'stops polling once %s, because it will not change on its own',
    (status) => {
      expect(shouldPollBill(status)).toBe(false);
    },
  );
});
