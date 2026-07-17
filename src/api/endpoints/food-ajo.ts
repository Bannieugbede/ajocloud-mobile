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
