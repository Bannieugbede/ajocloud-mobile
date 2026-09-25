import type { PaymentIntentTarget } from '@/api/endpoints/payments';

import {
  allowsPartPayment,
  methodsFor,
  queryKeysAfterPayment,
  withAmount,
} from './payment-targets';

const ajo: PaymentIntentTarget = { kind: 'AJO_CONTRIBUTION', groupId: 'g1', scheduleId: 's1' };
const akawo: PaymentIntentTarget = { kind: 'AKAWO_POOL_DUE', poolId: 'p1', dueId: 'd1' };
const food: PaymentIntentTarget = {
  kind: 'FOOD_SUBSCRIPTION',
  programmeId: 'f1',
  subscriptionId: 'sub1',
};

describe('methodsFor', () => {
  it('uses the methods the server returned, in its order', () => {
    expect(methodsFor({ targetType: 'AKAWO_POOL_DUE', methods: ['CARD', 'WALLET'] })).toEqual([
      'CARD',
      'WALLET',
    ]);
  });

  it.each([
    ['AKAWO_POOL_DUE', ['WALLET']],
    ['AJO_CONTRIBUTION', ['WALLET']],
    ['FOOD_SUBSCRIPTION', ['WALLET']],
    ['WALLET_TOPUP', ['TRANSFER', 'CARD']],
  ] as const)('falls back for %s to what the server would accept', (targetType, expected) => {
    expect(methodsFor({ targetType })).toEqual(expected);
  });
});

describe('allowsPartPayment', () => {
  it('allows part of an Ajo contribution, and nothing else', () => {
    expect(allowsPartPayment(ajo)).toBe(true);
    expect(allowsPartPayment(akawo)).toBe(false);
    expect(allowsPartPayment(food)).toBe(false);
    expect(allowsPartPayment({ kind: 'WALLET_TOPUP', amountMinor: '100000' })).toBe(false);
  });
});

describe('queryKeysAfterPayment', () => {
  it.each([
    ['an Ajo contribution', ajo, ['ajo-schedule', 'g1']],
    ['an Akawo due', akawo, ['akawo-pool', 'p1']],
    ['a Food enrolment', food, ['food-programme', 'f1']],
  ] as const)('refreshes the screens showing %s', (_label, target, key) => {
    expect(queryKeysAfterPayment(target)).toContainEqual(key);
  });

  it('always refreshes the wallet the money left', () => {
    for (const target of [ajo, akawo, food]) {
      expect(queryKeysAfterPayment(target)).toContainEqual(['wallet-balance']);
    }
  });
});

describe('withAmount', () => {
  it('asks for part of an Ajo contribution', () => {
    expect(withAmount(ajo, '150000')).toEqual({ ...ajo, amountMinor: '150000' });
  });

  it('asks for all of it when no amount is given', () => {
    expect(withAmount({ ...ajo, amountMinor: '150000' }, null)).toEqual(ajo);
  });

  it('never attaches an amount to a target the server prices itself', () => {
    // The server refuses an amount on these; sending one would fail the payment.
    expect(withAmount(akawo, '100')).toEqual(akawo);
    expect(withAmount(food, '100')).toEqual(food);
  });
});
