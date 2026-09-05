import { apiClient } from '@/api/client/api-client';

/** What the member has earned from referrals. Minor units as strings. */
export type ReferralSummary = {
  totalRewardMinor: string;
  currency: string;
  referralCount: number;
  qualifiedCount: number;
  /** The member's own code, or null before one is issued. */
  code: string | null;
};

export function getReferralSummary(): Promise<ReferralSummary> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/referrals/me');
}
