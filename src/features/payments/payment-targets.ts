import type { QueryKey } from '@tanstack/react-query';

import type {
  PaymentIntent,
  PaymentIntentTarget,
  PaymentMethod,
  PaymentTargetType,
} from '@/api/endpoints/payments';

/**
 * What the payment flow knows about each kind of payment, in one place.
 *
 * Every product hands its payment to the same screens (`usePayment`). They stay
 * generic because anything that differs between products is answered here: how
 * a product's payment may be made, and which of its screens are out of date
 * once it has been.
 *
 * Adding a product is one entry in this record. It is typed as a total record,
 * so a target kind added to the API fails to compile until it has one.
 */
type TargetConfig<K extends PaymentIntentTarget['kind']> = {
  /**
   * Methods to offer when the server does not say. Current servers return
   * `methods` on every intent (ADR-013) and that always wins; this keeps an
   * older server from being offered a method it would settle wrongly.
   */
  fallbackMethods: readonly PaymentMethod[];
  /**
   * Whether the member may pay part of what is owed. Mirrors the server's
   * `amountRule`, which refuses a part payment for any other target.
   */
  allowsPartPayment: boolean;
  /** The cached screens that show this target, refetched once it is paid. */
  refreshes: (target: Extract<PaymentIntentTarget, { kind: K }>) => QueryKey[];
};

/** Every balance and statement a payment moves. */
const WALLET_KEYS: QueryKey[] = [
  ['wallet-balance'],
  ['wallets'],
  ['wallet-summary'],
  ['wallet-history'],
  ['wallet-movements'],
  ['wallet'],
];

const TARGETS: { [K in PaymentIntentTarget['kind']]: TargetConfig<K> } = {
  AKAWO_POOL_DUE: {
    fallbackMethods: ['WALLET'],
    allowsPartPayment: false,
    refreshes: (target) => [['akawo-pool', target.poolId], ['akawo-pools']],
  },
  AJO_CONTRIBUTION: {
    fallbackMethods: ['WALLET'],
    // Flexible groups collect in whole units, so owing part of a round is
    // ordinary, and a member who can pay some of it now should not have to wait.
    allowsPartPayment: true,
    refreshes: (target) => [
      ['ajo-schedule', target.groupId],
      ['ajo-group', target.groupId],
      ['ajo-groups'],
    ],
  },
  FOOD_SUBSCRIPTION: {
    fallbackMethods: ['WALLET'],
    allowsPartPayment: false,
    refreshes: (target) => [
      ['food-subscriptions'],
      ['food-programme', target.programmeId],
      ['food-programmes'],
    ],
  },
  WALLET_TOPUP: {
    fallbackMethods: ['TRANSFER', 'CARD'],
    allowsPartPayment: false,
    refreshes: () => [],
  },
};

function configFor<K extends PaymentIntentTarget['kind']>(kind: K): TargetConfig<K> {
  return TARGETS[kind];
}

/** The methods to offer for an intent, in the server's order. */
export function methodsFor(intent: Pick<PaymentIntent, 'methods' | 'targetType'>): PaymentMethod[] {
  if (intent.methods && intent.methods.length > 0) return intent.methods;
  return [...configFor(intent.targetType as PaymentTargetType).fallbackMethods];
}

/** Whether the member may choose to pay less than everything owed. */
export function allowsPartPayment(target: PaymentIntentTarget): boolean {
  return configFor(target.kind).allowsPartPayment;
}

/** The query keys to refetch once a payment for `target` has moved money. */
export function queryKeysAfterPayment(target: PaymentIntentTarget): QueryKey[] {
  const config = configFor(target.kind) as TargetConfig<typeof target.kind>;
  return [...config.refreshes(target as never), ...WALLET_KEYS];
}

/**
 * The same target, asking to pay `amountMinor` of it. Only a target that allows
 * part payment carries an amount; for the rest the server reads its own.
 */
export function withAmount(
  target: PaymentIntentTarget,
  amountMinor: string | null,
): PaymentIntentTarget {
  if (target.kind !== 'AJO_CONTRIBUTION') return target;
  const { amountMinor: _previous, ...rest } = target;
  return amountMinor ? { ...rest, amountMinor } : rest;
}
