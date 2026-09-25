import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { AppLoadingState } from '@/components/ui/app-state';
import { isProgrammeId } from '@/services/incoming-link';
import { holdDestination } from '@/services/pending-invitation';
import { holdReferral } from '@/services/pending-referral';
import { restoreSession } from '@/services/session-storage';

/**
 * Where a shared Food Ajo programme link lands in the app (`/food/<id>` on the
 * website, redirected here by `+native-intent`).
 *
 * The programme screen lives in the tabs, which assume a session. Signed in,
 * this goes straight there. Signed out, the programme is held and the person
 * signs in first, then lands on it.
 */
export default function FoodLinkRoute() {
  const { programmeId, ref } = useLocalSearchParams<{ programmeId: string; ref?: string }>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (typeof ref === 'string') await holdReferral(ref).catch(() => undefined);
      const signedIn = (await restoreSession().catch(() => null)) !== null;
      if (cancelled) return;
      if (!isProgrammeId(programmeId)) {
        router.replace(signedIn ? '/(tabs)/food' : '/(auth)/sign-in');
        return;
      }
      if (signedIn) {
        router.replace({ pathname: '/(tabs)/food/[programmeId]', params: { programmeId } });
        return;
      }
      await holdDestination({ kind: 'food', programmeId }).catch(() => undefined);
      if (!cancelled) router.replace('/(auth)/sign-in');
    })();
    return () => {
      cancelled = true;
    };
  }, [programmeId, ref]);

  return <AppLoadingState label="Opening the programme" />;
}
