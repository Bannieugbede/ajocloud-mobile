import * as Application from 'expo-application';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { attributionFromInstallReferrer } from '@/services/install-referrer';
import { holdReferral } from '@/services/pending-referral';

const READ_KEY = 'ajo-cloud-install-referrer-read';

/**
 * Picks up an invitation or referral the website passed through Google Play.
 *
 * Someone who follows an invitation without the app installs it from the
 * website's Play badge. Without this, the app they open knows nothing about the
 * group they came to join. With it, the first launch goes straight to the
 * invitation, and a referral code is held for sign-up.
 *
 * It runs once per installation. Play keeps returning the same referrer for
 * months, and acting on it at every launch would reopen the invitation long
 * after it was dealt with. The flag is written before the referrer is read, so
 * a failure part-way cannot turn into a retry on every launch.
 *
 * Android only: the App Store has no equivalent. On an iPhone the website asks
 * the person to come back to the page after installing and open the link from
 * there.
 */
export function useInstallAttribution(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let cancelled = false;

    void (async () => {
      try {
        if (await SecureStore.getItemAsync(READ_KEY)) return;
        await SecureStore.setItemAsync(READ_KEY, new Date().toISOString());

        const { invitationCode, referralCode } = attributionFromInstallReferrer(
          await Application.getInstallReferrerAsync(),
        );
        if (referralCode) await holdReferral(referralCode);
        if (invitationCode && !cancelled) {
          router.push({
            pathname: '/join/[code]',
            params: referralCode
              ? { code: invitationCode, ref: referralCode }
              : { code: invitationCode },
          });
        }
      } catch {
        // No referrer (a sideloaded or emulator install) or no Play services.
        // The app works as an ordinary fresh install.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
