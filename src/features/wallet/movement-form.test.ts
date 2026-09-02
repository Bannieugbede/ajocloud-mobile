import { canSend, isPlausibleEmail, movementAmountError, withdrawalOutcome } from './movement-form';

describe('isPlausibleEmail', () => {
  it.each(['a@b.co', 'first.last@example.test'])('accepts %p', (value) => {
    expect(isPlausibleEmail(value)).toBe(true);
  });

  it.each(['', 'nope', 'a@b', 'a b@c.co'])('rejects %p', (value) => {
    expect(isPlausibleEmail(value)).toBe(false);
  });

  it('rejects an address longer than the column allows', () => {
    expect(isPlausibleEmail(`${'a'.repeat(320)}@b.co`)).toBe(false);
  });
});

describe('movementAmountError', () => {
  it('requires an amount', () => {
    expect(movementAmountError(null, '100000')).toMatch(/Enter an amount/i);
  });

  it('allows spending the whole balance', () => {
    expect(movementAmountError('100000', '100000')).toBeNull();
  });

  it('refuses one minor unit more than the balance, and says the balance', () => {
    expect(movementAmountError('100001', '100000')).toMatch(/₦1,000\.00 available/);
  });

  it('does not block while the balance is unknown', () => {
    // The backend re-checks against the ledger; guessing "no" here would stop
    // someone who can actually afford it.
    expect(movementAmountError('100000', null)).toBeNull();
  });

  it('stays exact far above the safe integer range', () => {
    const huge = (10n ** 20n).toString();
    expect(movementAmountError(huge, huge)).toBeNull();
    expect(movementAmountError((10n ** 20n + 1n).toString(), huge)).not.toBeNull();
  });
});

describe('canSend', () => {
  const base = { recipientEmail: 'a@b.co', amountMajor: '500', availableMinor: '100000' };

  it('is ready when everything checks out', () => {
    expect(canSend(base)).toBe(true);
  });

  it('is not ready without a plausible recipient', () => {
    expect(canSend({ ...base, recipientEmail: 'nope' })).toBe(false);
  });

  it('is not ready without an amount', () => {
    expect(canSend({ ...base, amountMajor: '' })).toBe(false);
  });

  it('is not ready when the amount exceeds the balance', () => {
    expect(canSend({ ...base, amountMajor: '5000' })).toBe(false);
  });
});

describe('withdrawalOutcome', () => {
  it.each(['PENDING', 'REVIEWING', 'PROCESSING'])(
    'treats %s as requested, not as money already arrived',
    (status) => {
      expect(withdrawalOutcome(status)).toBe('requested');
    },
  );

  it('reports a released payout as sent', () => {
    expect(withdrawalOutcome('SUCCEEDED')).toBe('sent');
  });

  it.each(['FAILED', 'REVERSED', 'CANCELLED'])('reports %s as failed', (status) => {
    expect(withdrawalOutcome(status)).toBe('failed');
  });
});
