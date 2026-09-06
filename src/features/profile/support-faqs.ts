import { environment } from '@/config/environment';

/**
 * The questions support is asked most, answered in the app.
 *
 * Static on purpose: these are product facts, not data. Putting them behind an
 * endpoint would mean a member with no connection — often exactly why they are
 * on this screen — could not read them.
 *
 * Every answer here describes behaviour the app actually implements. Nothing
 * about fees, penalties or timings is stated beyond what the product does:
 * where an amount depends on a rule that is not yet decided, the answer says
 * where to find it rather than inventing a figure.
 */

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export const FAQS: readonly Faq[] = [
  {
    id: 'join-ajo',
    question: 'How do I join an Ajo group?',
    answer:
      'Open the Ajo tab and tap Join, then enter the group code the organiser shared with you. You will see the contribution amount, how often it is collected and how many members there are before you commit to anything.',
  },
  {
    id: 'withdrawal-time',
    question: 'How long does a withdrawal take?',
    answer:
      'A withdrawal is reserved from your balance immediately and sent to your bank for settlement. Bank transfers usually arrive the same day, but the exact time is up to the receiving bank. Until it settles the amount shows as reserved rather than available, so you can always see where it is.',
  },
  {
    id: 'admin-fee',
    question: 'What is the admin fee?',
    answer:
      'Ajo Cloud does not currently charge a fee on contributions, payouts or wallet transfers. The full schedule is on the Platform Fees screen in your profile, and it is the only place fees are ever stated.',
  },
  {
    id: 'swap-position',
    question: 'Can I swap my position in an Ajo group?',
    answer:
      'Yes. Open the group, choose the member you would like to swap with and send a request. The swap only takes effect once they accept and the group admin approves it — nobody can move your position without your agreement.',
  },
  {
    id: 'food-ajo',
    question: 'How is Food Ajo different from regular Ajo?',
    answer:
      'A regular Ajo group pays out cash in rotation. Food Ajo collects towards a food package that is delivered to you at the end of the cycle, so what you receive is the food itself rather than money.',
  },
  {
    id: 'akawo',
    question: 'What is Akawo?',
    answer:
      'Akawo is for saving rather than rotating. You can set a personal savings goal and put money aside towards it, or run a group pool where everyone pays the same amount towards something shared — dues, a trip, an event — and the organiser can see who has paid.',
  },
  {
    id: 'money-safe',
    question: 'Is my money safe?',
    answer:
      'Every movement is recorded in a double-entry ledger, so your balance is always the sum of entries that can be traced. You need your transaction PIN to move money, and your card and bank details are held by our licensed payment provider rather than on your phone.',
  },
];

/** The address support replies from, when one is configured. */
export function supportEmail(): string | null {
  const address = environment.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
  return address ? address : null;
}

/**
 * A prefilled email to support.
 *
 * Carries a subject only. Nothing about the member is put in the body: the
 * account they are writing from already identifies them, and a mailto is
 * handed to whatever mail app the phone has.
 */
export function supportMailto(address: string): string {
  return `mailto:${address}?subject=${encodeURIComponent('Ajo Cloud support request')}`;
}
