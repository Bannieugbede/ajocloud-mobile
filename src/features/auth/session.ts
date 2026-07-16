import type { TokenPair } from '@/api/endpoints/auth';
import { saveSession } from '@/services/session-storage';

export function saveTokenPair(tokens: TokenPair): Promise<void> {
  return saveSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.accessTokenExpiresAt,
  });
}
