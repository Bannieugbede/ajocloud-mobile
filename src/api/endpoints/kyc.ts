import { apiClient } from '@/api/client/api-client';

export type KycTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type IdentityKind = 'BVN' | 'NIN' | 'VNIN';

/** Every action the server gates, and the stage it needs (ADR-015). */
export type KycAction =
  | 'ajo.join'
  | 'ajo.contribute'
  | 'akawo-pool.join'
  | 'akawo-goal.create'
  | 'food.subscribe'
  | 'payment'
  | 'withdrawal'
  | 'wallet.send'
  | 'ajo.create'
  | 'ajo.administer'
  | 'akawo-pool.create'
  | 'akawo-pool.administer'
  | 'food-programme.create'
  | 'food-coordinator.apply';

export type KycStageNumber = 1 | 2 | 3;

export type KycRequirementKey = 'account' | 'basicInfo' | 'pin' | 'nin' | 'ninDocument' | 'address';

export type KycRequirement = {
  key: KycRequirementKey;
  label: string;
  state: 'complete' | 'pending' | 'failed' | 'missing';
};

export type KycStage = {
  stage: KycStageNumber;
  title: string;
  status: 'complete' | 'in_progress' | 'under_review' | 'locked';
  requirements: KycRequirement[];
  unlocks: string[];
};

export type KycStatus = {
  // Staged verification (ADR-015). Optional because an API deployed before it
  // sends none of these; the app then gates nothing, as that API enforces nothing.
  /** Stages complete, 0 to 3. */
  level?: 0 | 1 | 2 | 3;
  /** The stage being worked on; null once fully verified. */
  currentStage?: KycStageNumber | null;
  restricted?: boolean;
  stages?: KycStage[];
  actions?: Record<KycAction, KycStageNumber>;
  tier: KycTier;
  status: string;
  steps: {
    personalDetails: { complete: boolean };
    identity: { complete: boolean; maskedIdentifier: string | null; kind: string | null };
    bankAccount: {
      complete: boolean;
      bankName?: string;
      accountMasked?: string;
      accountName?: string;
    };
  };
};

export type PersonalDetailsRequest = {
  /** ISO date, e.g. 1995-01-31. */
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  addressLine: string;
  city: string;
  state: string;
  occupation: string;
};

/**
 * The identity number is sent once and never retained by the client: it is not
 * written to state that persists, to storage, or to a log. See
 * ajocloud-backend/docs/adr/ADR-004.
 */
export type VerifyIdentityRequest = {
  kind: IdentityKind;
  identityNumber: string;
  consent: true;
};

export type VerifyIdentityResponse = {
  verified: boolean;
  maskedIdentifier: string;
  requiresReview: boolean;
};

export type Bank = { code: string; name: string };

export type AccountInquiry = { accountName: string; bankCode: string };

export type LinkedBankAccount = {
  id: string;
  bankCode: string;
  bankName: string;
  /** Last four digits only; the full number is never returned. */
  accountMasked: string;
  /** Name the bank returned at inquiry, not one the user typed. */
  accountName: string;
  verifiedAt: string;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function getKycStatus(): Promise<KycStatus> {
  return client().request('/api/v1/kyc/status');
}

export type BasicInfoRequest = {
  /** ISO date, e.g. 1995-01-31. */
  dateOfBirth: string;
  gender: PersonalDetailsRequest['gender'];
  occupation: string;
};

export type IdentityDocumentRequest = {
  type: 'NIN_SLIP' | 'NIN_CARD';
  contentType: 'image/jpeg' | 'image/png';
  /** Base64, without a data URL prefix. Never persisted on the device. */
  data: string;
};

export type AddressRequest = {
  addressLine: string;
  city: string;
  lga?: string;
  state: string;
};

export function updateBasicInfo(input: BasicInfoRequest): Promise<KycStatus> {
  return client().request('/api/v1/kyc/basic-info', { method: 'PATCH', body: input });
}

export function uploadIdentityDocument(
  input: IdentityDocumentRequest,
): Promise<{ documentId: string; type: string; uploadedAt: string }> {
  // A photo over a slow connection takes longer than an ordinary request.
  return client().request('/api/v1/kyc/identity/document', {
    method: 'POST',
    body: input,
    timeoutMs: 60_000,
  });
}

export function verifyAddress(
  input: AddressRequest,
): Promise<{ status: 'VERIFIED' | 'UNDER_REVIEW' }> {
  return client().request('/api/v1/kyc/address', { method: 'POST', body: input });
}

export function updatePersonalDetails(input: PersonalDetailsRequest): Promise<KycStatus> {
  return client().request('/api/v1/kyc/personal-details', { method: 'PATCH', body: input });
}

export function verifyIdentity(input: VerifyIdentityRequest): Promise<VerifyIdentityResponse> {
  return client().request('/api/v1/kyc/identity', { method: 'POST', body: input });
}

export function listBanks(): Promise<{ banks: Bank[] }> {
  return client().request('/api/v1/kyc/banks');
}

export function inquireAccount(input: {
  bankCode: string;
  accountNumber: string;
}): Promise<AccountInquiry> {
  return client().request('/api/v1/kyc/banks/inquire', { method: 'POST', body: input });
}

export function linkBankAccount(input: {
  bankCode: string;
  accountNumber: string;
}): Promise<LinkedBankAccount> {
  return client().request('/api/v1/kyc/bank-accounts', { method: 'POST', body: input });
}

/** Bank accounts already linked and verified. Wrapped, as the API returns it. */
export function listBankAccounts(): Promise<{ accounts: LinkedBankAccount[] }> {
  return client().request('/api/v1/kyc/bank-accounts');
}
