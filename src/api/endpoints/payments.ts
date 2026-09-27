import { apiClient } from '@/api/client/api-client';

/**
 * The payment contract every product pays through: Akawo pool dues, Ajo
 * contributions, Food enrolments, bills and wallet top-ups.
 *
 * See `docs/payments.md` and ADR-013 in the backend repo. The server decides
 * the amount and which methods a payment accepts; the app renders what it is
 * told. Product payments come from the wallet and settle inside the request.
 * A top-up comes from outside by transfer or card, and completes only when the
 * provider's webhook arrives.
 */

export type PaymentMethod = 'WALLET' | 'TRANSFER' | 'CARD';

export type PaymentTargetType =
  'AKAWO_POOL_DUE' | 'AJO_CONTRIBUTION' | 'FOOD_SUBSCRIPTION' | 'WALLET_TOPUP' | 'BILL_PAYMENT';

/**
 * What is being paid for. Adding a product means adding a variant here, a case
 * in `targetRequest` below, and an entry in `features/payments/payment-targets`.
 *
 * The server reads the amount from the target. Only an Ajo contribution, which
 * may be paid in part, and a top-up, which has no row to read one from, can
 * name one; the server refuses an amount on any other target.
 */
export type PaymentIntentTarget =
  | { kind: 'AKAWO_POOL_DUE'; poolId: string; dueId: string }
  | {
      kind: 'AJO_CONTRIBUTION';
      groupId: string;
      scheduleId: string;
      /** Part of what is owed. Omitted to pay all of it. */
      amountMinor?: string;
    }
  | { kind: 'FOOD_SUBSCRIPTION'; programmeId: string; subscriptionId: string }
  /**
   * The one target the client names an amount for, because a top-up has no row
   * to read one from. The server refuses an amount on every other kind, so this
   * cannot be used to underpay a due that has its own.
   */
  | { kind: 'WALLET_TOPUP'; amountMinor: string }
  /**
   * A bill, quoting the validation of the number it pays (backend ADR-014).
   * The payer prices airtime and electricity, so the amount travels; a
   * fixed-price package is refused at any other figure. The number itself is
   * sent only with the confirmation, because the server keeps just a digest of
   * it and needs it to pay the provider. It stays in memory, never in a route.
   */
  | {
      kind: 'BILL_PAYMENT';
      validationId: string;
      amountMinor: string;
      customerReference: string;
    };

/**
 * `REQUIRES_CONFIRMATION` is the server's name for "not yet paid for".
 * `CANCELLED` exists on the server but no client flow produces it today.
 */
export type PaymentIntentStatus =
  'REQUIRES_CONFIRMATION' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export type PaymentIntent = {
  id: string;
  status: PaymentIntentStatus;
  targetType: PaymentTargetType;
  targetId: string | null;
  amountMinor: string;
  /** Platform fee, separate so the screen can show what is charged and why. */
  feeMinor: string;
  totalMinor: string;
  currency: string;
  method: PaymentMethod | null;
  /**
   * The methods this payment accepts, in the order to offer them. Absent from
   * servers older than ADR-013, where `payment-targets` supplies the default.
   */
  methods?: PaymentMethod[];
  /** Server-supplied label for what is being paid, e.g. the pool's name. */
  description: string;
  expiresAt: string;
  settledAt: string | null;
  failureReason: string | null;
  /** Present only on the confirm response for TRANSFER. */
  transferInstructions?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    reference: string;
    expiresAt: string;
  };
  /** Present only on the confirm response for CARD. */
  checkoutUrl?: string;
};

export type WalletBalance = {
  availableMinor: string;
  currency: string;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

/** Maps a target to the flat body the API expects. */
function targetRequest(target: PaymentIntentTarget): {
  targetType: PaymentTargetType;
  targetId?: string;
  amountMinor?: string;
} {
  switch (target.kind) {
    case 'AKAWO_POOL_DUE':
      return { targetType: 'AKAWO_POOL_DUE', targetId: target.dueId };
    case 'AJO_CONTRIBUTION':
      return {
        targetType: 'AJO_CONTRIBUTION',
        targetId: target.scheduleId,
        ...(target.amountMinor ? { amountMinor: target.amountMinor } : {}),
      };
    case 'FOOD_SUBSCRIPTION':
      return { targetType: 'FOOD_SUBSCRIPTION', targetId: target.subscriptionId };
    case 'WALLET_TOPUP':
      // No target row to point at, so the amount travels with the request.
      return { targetType: 'WALLET_TOPUP', amountMinor: target.amountMinor };
    case 'BILL_PAYMENT':
      return {
        targetType: 'BILL_PAYMENT',
        targetId: target.validationId,
        amountMinor: target.amountMinor,
      };
  }
}

/**
 * Creates an intent for a target. The amount comes from the server for every
 * target that has a row to read one from, so a tampered request cannot underpay
 * a due.
 *
 * `idempotencyKey` is required: a retried tap must not create a second payment.
 * Repeating a key returns the original intent rather than an error.
 */
export function createPaymentIntent(
  target: PaymentIntentTarget,
  idempotencyKey: string,
): Promise<PaymentIntent> {
  return client().request('/api/v1/payments/intents', {
    method: 'POST',
    body: targetRequest(target),
    idempotencyKey,
  });
}

/**
 * Confirms an intent with a chosen method and the user's transaction PIN.
 *
 * The PIN is held in component state for this one call and never persisted,
 * logged, or put in a route param.
 */
export function confirmPaymentIntent(
  intentId: string,
  input: { method: PaymentMethod; transactionPin: string; customerReference?: string },
  idempotencyKey: string,
): Promise<PaymentIntent> {
  return client().request(`/api/v1/payments/intents/${encodeURIComponent(intentId)}/confirm`, {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
}

/** Polled while an intent is PROCESSING, e.g. awaiting a transfer to land. */
export function getPaymentIntent(intentId: string): Promise<PaymentIntent> {
  return client().request(`/api/v1/payments/intents/${encodeURIComponent(intentId)}`);
}

export function getWalletBalance(): Promise<WalletBalance> {
  return client().request('/api/v1/wallets/me/balance');
}
