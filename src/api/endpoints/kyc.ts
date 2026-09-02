import { apiClient } from '@/api/client/api-client';

export type KycTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type IdentityKind = 'BVN' | 'NIN' | 'VNIN';

export type KycStatus = {
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
