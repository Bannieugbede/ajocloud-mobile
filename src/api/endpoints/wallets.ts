import { apiClient } from '@/api/client/api-client';

export type Wallet = {
  id: string;
  currency: string;
  status: string;
  createdAt: string;
};

export function listWallets(): Promise<Wallet[]> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/wallets');
}
export type WalletSummary = {
  id: string;
  currency: string;
  status: string;
  availableMinor: string;
  reservedMinor: string;
};
export type WalletTransaction = {
  id: string;
  direction: 'DEBIT' | 'CREDIT';
  amountMinor: string;
  currency: string;
  createdAt: string;
  transaction: { reference: string; description: string; status: string; postedAt: string | null };
};
export function getWalletSummary(id: string): Promise<WalletSummary> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request(`/api/v1/wallets/${encodeURIComponent(id)}/summary`);
}
export function getWalletTransactions(id: string): Promise<WalletTransaction[]> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request(`/api/v1/wallets/${encodeURIComponent(id)}/transactions`);
}

export type Transfer = {
  id: string;
  internalReference: string;
  amountMinor: string;
  currency: string;
  status: string;
  createdAt: string;
  /** Which way the money went, without exposing the other party's wallet id. */
  direction?: 'IN' | 'OUT';
};

export type Withdrawal = {
  id: string;
  internalReference: string;
  amountMinor: string;
  currency: string;
  status: string;
  createdAt: string;
};

/**
 * Sends money to another member. Settles immediately: it is a movement inside
 * our own ledger, so there is no provider to wait for.
 */
export function sendToWallet(
  input: {
    sourceWalletId: string;
    recipientEmail: string;
    amountMinor: string;
    note?: string;
    transactionPin: string;
  },
  idempotencyKey: string,
): Promise<Transfer> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/wallets/send', {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
}

/**
 * Requests a payout to a linked bank account.
 *
 * Reserves the funds and stops at PENDING — the payout is released by an
 * operator, so the screen must not present this as money already sent.
 */
export function requestWithdrawal(
  input: {
    walletId: string;
    bankAccountId: string;
    amountMinor: string;
    transactionPin: string;
  },
  idempotencyKey: string,
): Promise<Withdrawal> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/wallets/withdrawals', {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
}

export function getWalletMovements(): Promise<{
  transfers: Transfer[];
  withdrawals: Withdrawal[];
}> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/wallets/me/movements');
}
