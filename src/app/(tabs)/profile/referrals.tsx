import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';

import { getReferralSummary } from '@/api/endpoints/referrals';
import { ReferralScreen } from '@/features/profile/referral-screen';
import { referralLink, referralShareMessage } from '@/features/profile/referral-share';
import { shareContent } from '@/services/share-links';
import { toast } from '@/components/ui/app-toast';

export default function ReferralsRoute() {
  // Same key as the profile menu's Rewards tile, so the figures agree and the
  // summary arrives from cache when it was just read there.
  const referrals = useQuery({
    queryKey: ['referral-summary'],
    queryFn: getReferralSummary,
    retry: 1,
  });

  const copyCode = (code: string) => {
    void Clipboard.setStringAsync(code).then(() => {
      // Confirmed explicitly: a copy that says nothing leaves the user unsure
      // whether it worked, and they cannot see the clipboard to check.
      toast.success(`Your referral code ${code} is copied.`);
    });
  };

  const shareCode = (code: string) => {
    void shareContent({ message: referralShareMessage(code), url: referralLink(code) });
  };

  return (
    <ReferralScreen
      {...(referrals.data ? { referrals: referrals.data } : {})}
      onCopyReferralCode={copyCode}
      onShareReferralCode={shareCode}
    />
  );
}
