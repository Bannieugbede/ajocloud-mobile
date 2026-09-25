import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { AppLoadingState } from '@/components/ui/app-state';
import { normalisePoolCode } from '@/services/incoming-link';
import { holdDestination } from '@/services/pending-invitation';
import { holdReferral } from '@/services/pending-referral';
import { restoreSession } from '@/services/session-storage';

/**
 * Where a shared Akawo pool link lands in the app (`/akawo/join/<code>` on the
 * website, redirected here by `+native-intent`).
 *
 * Signed in, it goes straight to the join screen with the code filled in and
 * looked up. Signed out, the code is held (it admits whoever holds it, so in
 * SecureStore) and the person signs in or creates an account, after which the
 * join screen opens as if they had never left.
 */
export default function PoolLinkRoute() {
  const { code, ref } = useLocalSearchParams<{ code: string; ref?: string }>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (typeof ref === 'string') await holdReferral(ref).catch(() => undefined);
      const joinCode = normalisePoolCode(code);
      const signedIn = (await restoreSession().catch(() => null)) !== null;
      if (cancelled) return;
      if (!joinCode) {
        router.replace(signedIn ? '/(tabs)/akawo/pools/join' : '/(auth)/sign-in');
        return;
      }
      if (signedIn) {
        router.replace({ pathname: '/(tabs)/akawo/pools/join', params: { code: joinCode } });
        return;
      }
      await holdDestination({ kind: 'akawo', code: joinCode }).catch(() => undefined);
      if (!cancelled) router.replace('/(auth)/sign-in');
    })();
    return () => {
      cancelled = true;
    };
  }, [code, ref]);

  return <AppLoadingState label="Opening the pool" />;
}
