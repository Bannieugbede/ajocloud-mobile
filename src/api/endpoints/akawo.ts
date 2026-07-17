import { apiClient } from '@/api/client/api-client';
export type AkawoGoal = {
  id: string;
  name: string;
  type: 'FLEXIBLE' | 'TARGET' | 'LOCKED';
  targetMinor: string;
  savedMinor: string;
  progressBps: number | null;
  currency: string;
  status: string;
  targetDate: string | null;
};
function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}
export function listAkawoGoals(): Promise<AkawoGoal[]> {
  return client().request('/api/v1/akawo/goals');
}
export function getAkawoGoal(id: string): Promise<AkawoGoal> {
  return client().request(`/api/v1/akawo/goals/${encodeURIComponent(id)}`);
}
