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

export type AkawoGoalType = 'FLEXIBLE' | 'TARGET' | 'LOCKED';

export type CreateAkawoGoalInput = {
  name: string;
  type: AkawoGoalType;
  /** Required by TARGET and LOCKED; a FLEXIBLE goal has no target. */
  targetMinor?: string;
  targetDate?: string;
};

export type AkawoSchedule = {
  id: string;
  amountMinor: string;
  dueAt: string;
  status: string;
};

export function createAkawoGoal(input: CreateAkawoGoalInput): Promise<AkawoGoal> {
  return client().request('/api/v1/akawo/goals', { method: 'POST', body: input });
}

/** A planned contribution towards a goal. */
export function createAkawoSchedule(
  goalId: string,
  input: { amountMinor: string; dueAt: string },
): Promise<AkawoSchedule> {
  return client().request(`/api/v1/akawo/goals/${encodeURIComponent(goalId)}/schedules`, {
    method: 'POST',
    body: input,
  });
}

export function getAkawoStatement(goalId: string): Promise<unknown> {
  return client().request(`/api/v1/akawo/goals/${encodeURIComponent(goalId)}/statement`);
}
