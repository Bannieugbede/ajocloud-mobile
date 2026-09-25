import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { AppLoadingState } from '@/components/ui/app-state';
import { holdReferral } from '@/services/pending-referral';
import { restoreSession } from '@/services/session-storage';

/**
 * Where a referral link lands: `ajocloud://join?ref=AJO-XXXXXX`, or the
 * website's `https://ajocloud.com/join?ref=…` once it opens the app.
 *
 * A referral only matters at sign-up, so this screen is a waypoint rather than
 * a destination. It holds the code, then sends someone without a session to
 * create an account, where the code is already filled in. Someone already
 * signed in has an account and nothing to apply the code to, so they go home.
 */
export default function ReferralLinkRoute() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // holdReferral ignores anything that is not a well-formed code.
      if (typeof ref === 'string') await holdReferral(ref).catch(() => undefined);
      const signedIn = (await restoreSession().catch(() => null)) !== null;
      if (cancelled) return;
      router.replace(signedIn ? '/(tabs)/home' : '/(auth)/register');
    })();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  return <AppLoadingState label="Opening your invitation" />;
}
