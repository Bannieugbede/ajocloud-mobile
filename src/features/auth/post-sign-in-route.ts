import { takeHeldInvitation } from '@/services/pending-invitation';

export type PostSignInRoute =
  { pathname: '/(tabs)/home' } | { pathname: '/join/[code]'; params: { code: string } };

/**
 * Where to go once a session exists.
 *
 * Normally the home tab. But someone who opened an invitation link, was asked
 * to sign in, and did so was part-way through joining a group — dropping them
 * on the home screen would silently abandon that, and the link may have been
 * the only copy of the code they had.
 *
 * Taking the held invitation rather than reading it means a code is offered
 * once, on the sign-in it was held for, and not re-offered on every later one.
 */
export async function postSignInRoute(): Promise<PostSignInRoute> {
  const code = await takeHeldInvitation();
  return code ? { pathname: '/join/[code]', params: { code } } : { pathname: '/(tabs)/home' };
}
