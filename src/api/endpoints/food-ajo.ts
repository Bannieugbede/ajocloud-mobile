import { apiClient } from '@/api/client/api-client';

export type FoodPackage = {
  id: string;
  name: string;
  priceMinor: string;
  priceLockedAt: string | null;
  currency: string;
  items: { id: string; name: string; quantity: string; unit: string }[];
};

export type FoodProgramme = {
  id: string;
  coordinatorUserId: string;
  name: string;
  status: string;
  currency: string;
  contributionMinor: string;
  contributionFrequency: string;
  enrolmentCapacity: number;
  fulfilmentMethod: string;
  startsAt: string;
  endsAt: string;
  plannedProcurementAt: string | null;
  distributionAt: string | null;
  packages: FoodPackage[];
  _count: { subscriptions: number };
};

export type FoodProgrammePage = { items: FoodProgramme[]; nextCursor: string | null };

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function listFoodProgrammes(): Promise<FoodProgrammePage> {
  return client().request('/api/v1/food-ajo/programmes?limit=25');
}

export function getFoodProgramme(programmeId: string): Promise<FoodProgramme> {
  return client().request(`/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}`);
}

export type FoodSubscription = {
  id: string;
  groupId: string;
  packageId: string;
  status: string;
  quantity: number;
  fulfilmentMethod: string;
  createdAt: string;
  group: { name: string; status: string; distributionAt: string | null };
  package: { name: string; priceMinor: string; currency: string };
};

/**
 * Enrols in one of a programme's packages.
 *
 * Each portion consumes a place, so quantity is checked against the
 * programme's remaining capacity rather than a headcount.
 */
export function subscribeToProgramme(
  programmeId: string,
  input: { packageId: string; quantity?: number; fulfilmentMethod?: string },
): Promise<FoodSubscription> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request(
    `/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/subscribe`,
    { method: 'POST', body: input },
  );
}

export function unsubscribeFromProgramme(programmeId: string): Promise<FoodSubscription> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request(
    `/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/unsubscribe`,
    { method: 'POST' },
  );
}

export function listMySubscriptions(): Promise<FoodSubscription[]> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/food-ajo/programmes/subscriptions/mine');
}
