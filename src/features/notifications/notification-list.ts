import type { Ionicons } from '@expo/vector-icons';

import type { InAppNotification } from '@/api/endpoints/notifications';

export type NotificationGroup = {
  label: string;
  items: InAppNotification[];
};

/**
 * Groups the feed by day, so a list of twenty entries reads as a timeline
 * rather than as a wall of timestamps.
 *
 * Relative labels are used for the recent past only; beyond that a date is
 * clearer than "13 days ago", which a person has to translate anyway.
 */
export function groupByDay(
  notifications: readonly InAppNotification[],
  now: Date,
): NotificationGroup[] {
  const groups = new Map<string, InAppNotification[]>();
  for (const notification of notifications) {
    const label = dayLabel(new Date(notification.createdAt), now);
    const existing = groups.get(label);
    if (existing) existing.push(notification);
    else groups.set(label, [notification]);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function dayLabel(at: Date, now: Date): string {
  const days = calendarDaysBetween(at, now);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${String(days)} days ago`;
  return at.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Whole calendar days apart, so something sent late last night reads as
    "Yesterday" rather than as "Today" because it is under 24 hours old. */
function calendarDaysBetween(at: Date, now: Date): number {
  const startOf = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.max(0, Math.round((startOf(now) - startOf(at)) / 86_400_000));
}

export function unreadIds(notifications: readonly InAppNotification[]): string[] {
  return notifications.filter((entry) => entry.readAt === null).map((entry) => entry.id);
}

/** The badge caps at 99+, because an exact count past that says nothing useful
    and makes the badge wider than the icon it sits on. */
export function badgeLabel(unreadCount: number): string | null {
  if (unreadCount <= 0) return null;
  return unreadCount > 99 ? '99+' : String(unreadCount);
}

/**
 * Which product a notification belongs to.
 *
 * Derived from the deep link first and the template second. `template` is a
 * free-form string on the backend and only `welcome` is dispatched today, so
 * matching on template names alone would be guessing at values that do not
 * exist yet. The deep link is the reliable signal: it has to name a real route
 * for the notification to be openable at all.
 */
export type NotificationCategory =
  'ajo' | 'akawo' | 'food' | 'bills' | 'payment' | 'security' | 'general';

export function categoryOf(notification: {
  template: string;
  deepLink: string | null;
}): NotificationCategory {
  const link = notification.deepLink ?? '';
  if (link.includes('/ajo')) return 'ajo';
  if (link.includes('/akawo')) return 'akawo';
  if (link.includes('/food')) return 'food';
  if (link.includes('/bills')) return 'bills';
  if (link.includes('/wallet') || link.includes('/payment')) return 'payment';
  if (link.includes('/security') || link.includes('/verify')) return 'security';

  // Falls back to the template, which is all a notification without a link has.
  const template = notification.template.toLowerCase();
  if (template.includes('ajo')) return 'ajo';
  if (template.includes('akawo')) return 'akawo';
  if (template.includes('food')) return 'food';
  if (template.includes('bill')) return 'bills';
  if (
    template.includes('payment') ||
    template.includes('wallet') ||
    template.includes('payout') ||
    template.includes('deposit')
  ) {
    return 'payment';
  }
  if (
    template.includes('security') ||
    template.includes('login') ||
    template.includes('password') ||
    template.includes('device')
  ) {
    return 'security';
  }
  return 'general';
}

/** The icon each category is drawn with, matching the tab it belongs to. */
export function categoryIcon(
  category: NotificationCategory,
): React.ComponentProps<typeof Ionicons>['name'] {
  return {
    ajo: 'people-outline',
    akawo: 'wallet-outline',
    food: 'basket-outline',
    bills: 'receipt-outline',
    payment: 'card-outline',
    security: 'shield-checkmark-outline',
    general: 'notifications-outline',
  }[category] as React.ComponentProps<typeof Ionicons>['name'];
}

/**
 * The clock time a notification is stamped with.
 *
 * Only the time, never the date: every row already sits under a day heading
 * from `groupByDay`, so a date here would repeat what the heading just said.
 */
export function timeLabel(at: Date): string {
  return at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** A one-line summary for the header, so the count is not only a number. */
export function unreadSummary(unreadCount: number, total: number): string {
  // The empty state below already says "Nothing yet"; repeating it in the
  // subtitle would print the same words twice on one screen.
  if (total === 0) return 'Your updates appear here';
  if (unreadCount === 0) return 'You are all caught up';
  return `${String(unreadCount)} unread`;
}
