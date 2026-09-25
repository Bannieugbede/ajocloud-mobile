import { takeHeldDestination } from '@/services/pending-invitation';

export type PostSignInRoute =
  | { pathname: '/(tabs)/home' }
  | { pathname: '/join/[code]'; params: { code: string } }
  | { pathname: '/(tabs)/akawo/pools/join'; params: { code: string } }
  | { pathname: '/(tabs)/food/[programmeId]'; params: { programmeId: string } };

/**
 * Where to go once a session exists.
 *
 * Normally the home tab. But someone who opened a shared link (an Ajo
 * invitation, an Akawo pool, a Food Ajo programme), was asked to sign in, and
 * did so was part-way through joining something. Dropping them on the home
 * screen would silently abandon that, and the link may have been the only copy
 * of the code they had.
 *
 * Taking the held destination rather than reading it means it is offered once,
 * on the sign-in it was held for, and not re-offered on every later one.
 */
export async function postSignInRoute(): Promise<PostSignInRoute> {
  const held = await takeHeldDestination();
  if (!held) return { pathname: '/(tabs)/home' };
  switch (held.kind) {
    case 'ajo':
      return { pathname: '/join/[code]', params: { code: held.code } };
    case 'akawo':
      return { pathname: '/(tabs)/akawo/pools/join', params: { code: held.code } };
    case 'food':
      return { pathname: '/(tabs)/food/[programmeId]', params: { programmeId: held.programmeId } };
  }
}
