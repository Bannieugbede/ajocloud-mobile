import { apiClient } from '@/api/client/api-client';

export type VerificationChannel = 'PHONE' | 'EMAIL';

export type VerificationChallenge = {
  userId: string;
  channel: VerificationChannel;
  destinationMasked: string;
  expiresAt: string;
  resendAvailableAt: string;
  deliveryStatus: 'SENT' | 'FAILED';
  nextStep?: 'VERIFY_EMAIL';
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
  email: string;
  phone: string;
  password: string;
  acceptedTerms: true;
  acceptedPrivacy: true;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function registerAccount(input: RegisterRequest): Promise<VerificationChallenge> {
  return client().request('/api/v1/auth/register', { method: 'POST', body: input });
}

export function verifyPhone(userId: string, code: string): Promise<VerificationChallenge> {
  return client().request('/api/v1/auth/verify-phone', {
    method: 'POST',
    body: { userId, code },
  });
}

export function verifyEmail(userId: string, code: string): Promise<TokenPair> {
  return client().request('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { userId, code },
  });
}

export function resendVerification(
  userId: string,
  channel: VerificationChannel,
): Promise<VerificationChallenge> {
  return client().request('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: { userId, channel },
  });
}

export function login(input: { email: string; password: string }): Promise<TokenPair> {
  return client().request('/api/v1/auth/login', { method: 'POST', body: input });
}

export function logout(): Promise<void> {
  return client().request('/api/v1/auth/logout', { method: 'POST' });
}
