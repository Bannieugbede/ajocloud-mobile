import { apiClient } from '@/api/client/api-client';

export type FoodPackage = {
  id: string;
  name: string;
  /** A photograph of the package, or null when none has been supplied. */
  imageUrl: string | null;
  description: string | null;
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
  /** Who runs the programme, and whether their identity is verified. */
  coordinatorName?: string;
  coordinatorVerified?: boolean;
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

/**
 * A member's application to become a food coordinator. Only the status matters
 * to the Food tab: it decides whether the tab invites an application or reports
 * one already in progress.
 */
export type FoodCoordinatorApplication = {
  id: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
};

export function listMyCoordinatorApplications(): Promise<FoodCoordinatorApplication[]> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/food-coordinator-applications/me');
}

/**
 * The four JSON objects the backend stores unvalidated, plus the settlement
 * details it does check on submit.
 *
 * Nothing constrains the objects' shape server side, so the keys are the
 * client's contract with whoever reviews the application. They are documented
 * in `docs/BACKEND_REQUIREMENTS.md` and built by
 * `src/features/food/coordinator-application-form.ts`.
 *
 * `settlementAccountMasked` is the only account field there is: a raw account
 * number is never sent, stored, or logged.
 */
export type CreateFoodCoordinatorApplication = {
  personalDetails: Record<string, unknown>;
  businessDetails?: Record<string, unknown>;
  operatingLocation: Record<string, unknown>;
  fulfilmentLocations: Record<string, unknown>;
  settlementBankCode: string;
  settlementAccountMasked: string;
  verificationConsent: boolean;
  termsAccepted: boolean;
};

/** Creates the application as a DRAFT. It is not in review until submitted. */
export function createCoordinatorApplication(
  body: CreateFoodCoordinatorApplication,
): Promise<FoodCoordinatorApplication> {
  return client().request('/api/v1/food-coordinator-applications', { method: 'POST', body });
}

/**
 * Rewrites an editable application — one still DRAFT, or sent back for more
 * information. The backend refuses any other status.
 *
 * Needed because creating and submitting are two calls: when the second fails,
 * the draft from the first survives, and the backend then refuses to create a
 * second one. Recovering means updating that draft rather than making another.
 */
export function updateCoordinatorApplication(
  applicationId: string,
  body: CreateFoodCoordinatorApplication,
): Promise<FoodCoordinatorApplication> {
  return client().request(
    `/api/v1/food-coordinator-applications/${encodeURIComponent(applicationId)}`,
    { method: 'PATCH', body },
  );
}

/**
 * Puts a draft into review.
 *
 * Separate from creating it because the backend keeps them separate: a draft
 * can be corrected, and only a submission starts the clock on a decision.
 */
export function submitCoordinatorApplication(
  applicationId: string,
): Promise<FoodCoordinatorApplication> {
  return client().request(
    `/api/v1/food-coordinator-applications/${encodeURIComponent(applicationId)}/submit`,
    { method: 'POST' },
  );
}
