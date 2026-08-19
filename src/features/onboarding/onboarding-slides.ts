import type { ComponentType } from 'react';

import {
  ContributeIllustration,
  GoalIllustration,
  SecureWalletIllustration,
  type SlideIllustrationProps,
} from './slide-illustrations';

export type OnboardingSlide = {
  key: string;
  /** Leading words rendered in the emphasised brand weight. */
  titleLead: string;
  titleRest: string;
  caption: string;
  Illustration: ComponentType<SlideIllustrationProps>;
};

/**
 * Static product copy. Per AGENTS.md this stays local: it is not user-specific,
 * mutable, or administratively managed, so it needs no API or store.
 */
export const onboardingSlides: readonly OnboardingSlide[] = [
  {
    key: 'contribute',
    titleLead: 'Save Together',
    titleRest: 'With People You Trust',
    caption:
      'Create or join an Ajo group, agree the amount and schedule, and let every contribution be tracked in one place.',
    Illustration: ContributeIllustration,
  },
  {
    key: 'goals',
    titleLead: 'Reach Your Goals',
    titleRest: 'With Personal Akawo',
    caption:
      'Set a target for school fees, rent, or a food package, then watch each deposit move you closer.',
    Illustration: GoalIllustration,
  },
  {
    key: 'payouts',
    titleLead: 'Get Paid Out',
    titleRest: 'Safely And On Time',
    caption:
      'Every payout follows the order your group agreed, with balances and receipts you can check any time.',
    Illustration: SecureWalletIllustration,
  },
] as const;
