import { ApiClient } from '@/api/client/api-client';
import type { TokenPair } from '@/api/endpoints/auth';
import { environment } from '@/config/environment';

/**
 * Exchanging a refresh token for a new session.
 *
 * This lives apart from the other auth endpoints, and on its own client, to
 * break a cycle: the shared client asks the session manager for an access
 * token, and the session manager refreshes by calling here. If this call went
 * through that client it would ask for a token in order to fetch a token, and
 * a refresh triggered by an expired token would trigger another refresh.
 *
 * The client below is deliberately unauthenticated. The refresh token in the
 * body is the entire credential; an Authorization header would add nothing and
 * would be an expired token anyway.
 */

const refreshClient = environment.EXPO_PUBLIC_API_BASE_URL
  ? new ApiClient(environment.EXPO_PUBLIC_API_BASE_URL)
  : null;

export function refreshSession(refreshToken: string): Promise<TokenPair> {
  if (!refreshClient) throw new Error('API configuration is unavailable');
  return refreshClient.request('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}
