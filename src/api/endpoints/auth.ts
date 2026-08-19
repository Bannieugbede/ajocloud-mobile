import { apiClient } from '@/api/client/api-client';

export type VerificationChallenge = {
  userId: string;
  channel: 'EMAIL';
  destinationMasked: string;
  expiresAt: string;
  resendAvailableAt: string;
  deliveryStatus: 'SENT' | 'FAILED';
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  accessTokenExpiresAt: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  /** E.164, e.g. +2348012345678. */
  phone: string;
  email: string;
  password: string;
  referralCode?: string;
  acceptedPrivacy: true;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function registerAccount(input: RegisterRequest): Promise<VerificationChallenge> {
  return client().request('/api/v1/auth/register', { method: 'POST', body: input });
}

export function verifyEmail(userId: string, code: string): Promise<TokenPair> {
  return client().request('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { userId, code },
  });
}

export function resendVerification(userId: string): Promise<VerificationChallenge> {
  return client().request('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: { userId },
  });
}

export function login(input: { email: string; password: string }): Promise<TokenPair> {
  return client().request('/api/v1/auth/login', { method: 'POST', body: input });
}

export type PasswordResetChallenge = {
  challengeId: string;
  destinationMasked: string;
  expiresAt: string;
  resendAvailableAt: string;
};

/** Starts a password reset. Always succeeds, so it cannot reveal whether an account exists. */
export function requestPasswordReset(email: string): Promise<PasswordResetChallenge> {
  return client().request('/api/v1/auth/password-reset/request', {
    method: 'POST',
    body: { email },
  });
}

/** Verifies the emailed code and sets the new password. */
export function completePasswordReset(input: {
  challengeId: string;
  code: string;
  password: string;
}): Promise<void> {
  return client().request('/api/v1/auth/password-reset/complete', {
    method: 'POST',
    body: input,
  });
}

/** Exchanges the one-time code from the Google deep link for a session. */
export function exchangeGoogleCode(code: string): Promise<TokenPair> {
  return client().request('/api/v1/auth/google/exchange', {
    method: 'POST',
    body: { code },
  });
}

export function logout(): Promise<void> {
  return client().request('/api/v1/auth/logout', { method: 'POST' });
}

export type TransactionPinStatus = {
  isSet: boolean;
  /** ISO timestamp while the PIN is locked after too many wrong attempts. */
  lockedUntil: string | null;
};

export function transactionPinStatus(): Promise<TransactionPinStatus> {
  return client().request('/api/v1/auth/transaction-pin', { method: 'GET' });
}

/** Sets or replaces the transaction PIN. `currentPin` is required to replace one. */
export function setTransactionPin(input: {
  pin: string;
  currentPin?: string;
}): Promise<TransactionPinStatus> {
  return client().request('/api/v1/auth/transaction-pin', { method: 'POST', body: input });
}
