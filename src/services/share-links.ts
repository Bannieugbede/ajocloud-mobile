import { Platform, Share } from 'react-native';

import { environment } from '@/config/environment';

/**
 * Links members send to other people, on the website, in their short form:
 * `/g/<code>` (Ajo), `/p/<code>` (Akawo pool), `/f/<code>` (Food Ajo) and
 * `/r/<code>` (referral). See docs/share-links.md in the backend.
 *
 * A website link rather than the app's scheme, because it works for everyone:
 * with the app installed it opens the app, and without it the page describes
 * what was shared and lets them join on the web or get the app. Social apps
 * read the page's preview, so the link unfurls with the group's name and
 * amount. Null when no web address is configured, so a half-built link never
 * goes into a message that cannot be taken back.
 */
function webLink(path: string): string | null {
  const base = environment.EXPO_PUBLIC_WEB_URL;
  return base ? `${base.replace(/\/+$/, '')}${path}` : null;
}

/** An Ajo group: an invitation code, or a listed group's public code. */
export function groupLink(code: string): string | null {
  return webLink(`/g/${encodeURIComponent(code)}`);
}

/** An Akawo pool: its join code, or a listed pool's public code. */
export function poolLink(code: string): string | null {
  return webLink(`/p/${encodeURIComponent(code)}`);
}

/** A Food Ajo programme, by its public code. */
export function foodProgrammeLink(shortCode: string): string | null {
  return webLink(`/f/${encodeURIComponent(shortCode)}`);
}

/** A member's referral code. */
export function referralLink(code: string): string | null {
  return webLink(`/r/${encodeURIComponent(code)}`);
}

/**
 * What goes into the share sheet. `message` is the whole text, link included,
 * which is what Android and most chat apps send. `url` is the link alone, for
 * iOS, which fetches the page's preview for the share sheet from it.
 */
export type ShareContent = { message: string; url: string | null };

function withLink(lines: string[], url: string | null): ShareContent {
  return { message: [...lines, url ?? ''].filter((line) => line !== '').join('\n'), url };
}

export function groupShareMessage(groupName: string, code: string): ShareContent {
  return withLink([`Join "${groupName}" on Ajo Cloud.`], groupLink(code));
}

/**
 * A pool is shared with its join code as well as the link, for someone typing
 * it into the app. A listed pool's public code is not a join code, so it is
 * never offered as one.
 */
export function poolShareMessage(
  poolName: string,
  code: string,
  { typeable = true }: { typeable?: boolean } = {},
): ShareContent {
  const shared = withLink([`Join "${poolName}" on Ajo Cloud.`], poolLink(code));
  return typeable
    ? { ...shared, message: `${shared.message}\nOr enter code ${code} in the app.` }
    : shared;
}

export function foodShareMessage(programmeName: string, shortCode: string): ShareContent | null {
  const url = foodProgrammeLink(shortCode);
  return url ? withLink([`Save towards "${programmeName}" with me on Ajo Cloud.`], url) : null;
}

/**
 * Opens the share sheet. On iOS the link is also passed on its own, so the
 * sheet and apps like iMessage show the page's preview; the message still
 * carries it for apps that take text only. Android takes text only.
 */
export function shareContent({ message, url }: ShareContent): Promise<unknown> {
  if (Platform.OS === 'ios' && url) return Share.share({ message, url });
  return Share.share({ message });
}
