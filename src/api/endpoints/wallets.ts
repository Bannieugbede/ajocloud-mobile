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
