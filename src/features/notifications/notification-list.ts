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
