import {
  MINIMUM_TOPUP_MINOR,
  QUICK_AMOUNTS_MINOR,
  topupAmountMinor,
  topupProblem,
  topupProblemMessage,
} from './fund-wallet';

describe('the amount being added', () => {
  it('says nothing about a field nobody has filled in yet', () => {
    // An error on an untouched field reads as a mistake the member has not
    // made, which is the fastest way to make a form feel hostile.
    expect(topupProblem('')).toBe('empty');
    expect(topupProblemMessage('empty', '₦500')).toBeNull();
  });

  it('rejects an amount below what the server will accept', () => {
    // Mirrors MINIMUM_DEPOSIT_MINOR. Enforced here so the member is told
    // before they commit rather than by a 422 afterwards.
    expect(topupProblem('100')).toBe('too-small');
    expect(topupProblem('499')).toBe('too-small');
  });

  it('accepts the minimum exactly', () => {
    expect(topupProblem('500')).toBeNull();
  });

  it('rejects something that is not a number', () => {
    expect(topupProblem('ten thousand')).toBe('invalid');
  });

  it('names the minimum rather than just refusing', () => {
    expect(topupProblemMessage('too-small', '₦500')).toContain('₦500');
  });

  it('holds back the amount until it is payable', () => {
    expect(topupAmountMinor('100')).toBeNull();
    expect(topupAmountMinor('')).toBeNull();
    expect(topupAmountMinor('10000')).toBe('1000000');
  });
});

describe('the quick amounts', () => {
  it('every one clears the minimum, so no tap can be refused', () => {
    // A quick-select that produced an error would be worse than not offering
    // it: the member did not type it, so they cannot see what is wrong.
    for (const amount of QUICK_AMOUNTS_MINOR) {
      expect(BigInt(amount) >= MINIMUM_TOPUP_MINOR).toBe(true);
    }
  });

  it('rises, so the row reads in order', () => {
    const values = QUICK_AMOUNTS_MINOR.map((amount) => BigInt(amount));
    for (let index = 1; index < values.length; index += 1) {
      expect(values[index]! > values[index - 1]!).toBe(true);
    }
  });
});
