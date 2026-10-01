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
  /** The programme's public code: its link is ajocloud.com/f/<shortCode>. */
  shortCode: string;
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

function listFoodProgrammesInScope(
  scope: 'ALL' | 'COORDINATED',
  cursor?: string,
): Promise<FoodProgrammePage> {
  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
  return client().request(`/api/v1/food-ajo/programmes?limit=25&scope=${scope}${cursorParam}`);
}

export function listFoodProgrammes(): Promise<FoodProgrammePage> {
  return listFoodProgrammesInScope('ALL');
}

export function listCoordinatedFoodProgrammes(cursor?: string): Promise<FoodProgrammePage> {
  return listFoodProgrammesInScope('COORDINATED', cursor);
}

export type CreateFoodProgrammeInput = {
  name: string;
  contributionMinor: string;
  contributionFrequency: string;
  enrolmentCapacity: number;
  fulfilmentMethod: string;
  startsAt: string;
  endsAt: string;
  plannedProcurementAt?: string;
  distributionAt?: string;
  packages: {
    name: string;
    priceMinor: string;
    items: { name: string; quantity: string; unit: string }[];
  }[];
};

export function createFoodProgramme(input: CreateFoodProgrammeInput): Promise<FoodProgramme> {
  return client().request('/api/v1/food-ajo/programmes', { method: 'POST', body: input });
}

export function transitionFoodProgramme(programmeId: string, status: string): Promise<unknown> {
  return client().request(`/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function updateFoodPackage(
  programmeId: string,
  packageId: string,
  input: { name?: string; priceMinor?: string },
): Promise<unknown> {
  return client().request(
    `/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/packages/${encodeURIComponent(packageId)}`,
    { method: 'PATCH', body: input },
  );
}

export type FoodProcurementPlan = {
  programme: {
    id: string;
    name: string;
    status: string;
    currency: string;
    enrolmentCapacity: number;
  };
  totalPortions: number;
  expectedMinor: string;
  collectedMinor: string;
  packages: {
    packageId: string;
    name: string;
    priceMinor: string;
    subscribers: number;
    portions: number;
    expectedMinor: string;
    collectedMinor: string;
    items: { name: string; unit: string; unitQuantity: string; totalQuantity: string }[];
  }[];
};

export function getFoodProcurementPlan(programmeId: string): Promise<FoodProcurementPlan> {
  return client().request(
    `/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/procurement-plan`,
  );
}

export type FoodDistribution = {
  id: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  items: { id: string; quantity: number; confirmation?: { confirmedAt: string | null } | null }[];
};

export function listFoodDistributions(programmeId: string): Promise<FoodDistribution[]> {
  return client().request(
    `/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/distributions`,
  );
}

export function createFoodDistribution(
  programmeId: string,
  scheduledAt: string,
): Promise<FoodDistribution> {
  return client().request(
    `/api/v1/food-ajo/programmes/${encodeURIComponent(programmeId)}/distributions`,
    {
      method: 'POST',
      body: { scheduledAt },
    },
  );
}

/**
 * A programme's public description, by its short code or id. Unauthenticated:
 * this is how a shared `/f/<code>` link is turned into the programme id the
 * rest of the app works with.
 */
export function previewFoodProgramme(idOrCode: string): Promise<{ id: string; shortCode: string }> {
  return client().request(`/api/v1/public/food-programmes/${encodeURIComponent(idOrCode)}`);
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
  /**
   * What the enrolment costs in total, and how much of it has been paid. An
   * enrolment is PENDING until paid in full, then ACTIVE. Absent from the
   * subscribe response, which is always a fresh, unpaid enrolment.
   */
  amountDueMinor?: string;
  amountPaidMinor?: string;
  paidAt?: string | null;
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

/**
 * Withdraws from a programme. A paid enrolment is refunded to the wallet, which
 * the server allows only until buying begins.
 */
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
