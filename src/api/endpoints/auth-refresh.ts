import { apiClient } from '@/api/client/api-client';
import type { TokenPair } from '@/api/endpoints/auth';

/**
 * Exchanging a refresh token for a new session.
 *
 * Kept apart from the other auth endpoints so that `session-manager` can import
 * it without dragging in the rest of the auth surface.
 *
 * The call is deliberately unauthenticated: the refresh token in the body is
 * the whole credential, the access token it replaces is spent anyway, and a
 * refresh that tried to refresh on its own 401 would recurse.
 */
export function refreshSession(refreshToken: string): Promise<TokenPair> {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient.request('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    unauthenticated: true,
  });
}
