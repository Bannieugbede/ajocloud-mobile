import { apiClient } from '@/api/client/api-client';

export type CurrentUser = {
  id: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'DEACTIVATED';
  profile: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    timezone: string;
    locale: string;
  };
};

export function getCurrentUser(): Promise<CurrentUser> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/users/me');
}

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  timezone?: string;
};

/**
 * Updates the caller's profile.
 *
 * Returns the profile alone, not the whole user: writing this response into a
 * `current-user` cache entry would blank the email and status everywhere they
 * are read.
 */
export type UserProfile = CurrentUser['profile'];

export function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/users/me', { method: 'PATCH', body: input });
}

/**
 * Raises a support enquiry.
 *
 * Name and email are required by the endpoint, which is shared with the public
 * marketing site. The app fills them from the signed-in account rather than
 * asking again, so a member never types details we already hold.
 */
export function createSupportInquiry(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<unknown> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/engagement/support-inquiries', {
    method: 'POST',
    body: input,
  });
}
