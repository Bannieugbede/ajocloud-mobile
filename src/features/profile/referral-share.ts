/**
 * The message sent when a member shares their referral code.
 *
 * Kept out of the screen so it can be tested: this text goes to other people
 * through WhatsApp and SMS, and a broken link or a missing code in it is a
 * mistake nobody can correct after it is sent.
 */

import { environment } from '@/config/environment';

/**
 * A share message carrying both the code and a link.
 *
 * Both, because they fail in different situations: a link is useless read
 * aloud or retyped from a screenshot, and a code alone gives someone who has
 * never heard of Ajo Cloud nowhere to go.
 */
export function referralShareMessage(code: string): string {
  const link = referralLink(code);
  return [
    `Join me on Ajo Cloud and we both earn.`,
    ``,
    `Use my referral code: ${code}`,
    link ? `Sign up here: ${link}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Where a shared code sends someone, or null when no web address is
 * configured. Returning null rather than a broken URL keeps a half-built link
 * out of a message that has already been sent.
 */
export function referralLink(code: string): string | null {
  const base = environment.EXPO_PUBLIC_WEB_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, '')}/join?ref=${encodeURIComponent(code)}`;
}
