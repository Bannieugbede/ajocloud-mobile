import type { CurrentUser, UserProfile } from '@/api/endpoints/users';

/**
 * Merges an updated profile into the cached user.
 *
 * `PATCH /users/me` returns the profile alone, not the whole user. Assigning
 * that response to the `current-user` cache entry would blank the email and
 * status on every screen that reads them.
 */
export function mergeProfile(
  current: CurrentUser | undefined,
  profile: UserProfile,
): CurrentUser | undefined {
  return current ? { ...current, profile } : current;
}
