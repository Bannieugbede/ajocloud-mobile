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
