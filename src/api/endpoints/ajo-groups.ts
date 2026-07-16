import { apiClient } from '@/api/client/api-client';

export type AjoGroupSummary = {
  id: string;
  name: string;
  status: string;
  contributionFrequency: string;
  contributionMode: string;
  baseContributionMinor: string;
  currency: string;
  maxSlots: number;
  maxMembers: number;
  startDate: string;
  endDate: string;
  _count: { slots: number; members: number };
};

export function listAjoGroups(): Promise<AjoGroupSummary[]> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/ajo-groups');
}
