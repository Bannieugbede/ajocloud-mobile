import { apiClient } from '@/api/client/api-client';

/**
 * The payment contract every feature pays through.
 *
 * Implemented on the backend as of 2026-09-02 — see `docs/payments.md` and
 * ADR-008 in the backend repo. Wallet payments settle inside the request;
 * transfer and card payments reach PROCESSING and wait for a provider webhook
 * that is not yet written, so they cannot complete today.
 */

export type PaymentMethod = 'WALLET' | 'TRANSFER' | 'CARD';

export type PaymentTargetType =
  'AKAWO_POOL_DUE' | 'AJO_CONTRIBUTION' | 'FOOD_SUBSCRIPTION' | 'WALLET_TOPUP';

/**
 * What is being paid for. Adding a product means adding a variant here and a
 * case in `targetRequest` below.
 *
 * Note there is no amount: the server reads it from the target. Sending one
 * would be ignored, and accepting one would be an underpayment vulnerability.
 */
export type PaymentIntentTarget =
  | { kind: 'AKAWO_POOL_DUE'; poolId: string; dueId: string }
  | { kind: 'AJO_CONTRIBUTION'; groupId: string; scheduleId: string }
  | { kind: 'FOOD_SUBSCRIPTION'; subscriptionId: string }
  | { kind: 'WALLET_TOPUP' };

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
} {
  switch (target.kind) {
    case 'AKAWO_POOL_DUE':
      return { targetType: 'AKAWO_POOL_DUE', targetId: target.dueId };
    case 'AJO_CONTRIBUTION':
      return { targetType: 'AJO_CONTRIBUTION', targetId: target.scheduleId };
    case 'FOOD_SUBSCRIPTION':
      return { targetType: 'FOOD_SUBSCRIPTION', targetId: target.subscriptionId };
    case 'WALLET_TOPUP':
      // No target row to point at; the server refuses this until a funding
      // contract defines where the amount comes from.
      return { targetType: 'WALLET_TOPUP' };
  }
}

/**
 * Creates an intent for a target. The amount comes from the server, not the
 * client, so a tampered request cannot underpay a due.
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
  input: { method: PaymentMethod; transactionPin: string },
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
