import { apiClient } from '@/api/client/api-client';

export type CurrentUser = {
  id: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'DEACTIVATED';
  profile: { firstName: string; lastName: string; avatarUrl: string | null };
};

export function getCurrentUser(): Promise<CurrentUser> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/users/me');
}
