import type { InAppNotification } from '@/api/endpoints/notifications';

import {
  badgeLabel,
  categoryIcon,
  categoryOf,
  dayLabel,
  groupByDay,
  timeLabel,
  unreadIds,
  unreadSummary,
} from './notification-list';

// Local-time constructors: the labels are calendar-day based, so UTC literals
// would make this test pass or fail depending on the machine's timezone.
const now = new Date(2026, 8, 3, 12, 0, 0);
const at = (day: number, hour: number) => new Date(2026, 8, day, hour, 0, 0);

const notification = (overrides: Partial<InAppNotification> = {}): InAppNotification => ({
  id: 'n-1',
  template: 'ajo-payout-sent',
  title: 'Your payout was sent',
  body: '₦50,000 was sent',
  deepLink: '/(tabs)/ajo',
  readAt: null,
  createdAt: now.toISOString(),
  ...overrides,
});

describe('dayLabel', () => {
  it('names today and yesterday rather than dating them', () => {
    expect(dayLabel(now, now)).toBe('Today');
    expect(dayLabel(at(2, 23), now)).toBe('Yesterday');
  });

  it('treats late last night as yesterday, not as today', () => {
    // Under 24 hours old but a different calendar day: "Today" would be wrong.
    expect(dayLabel(at(2, 22), now)).toBe('Yesterday');
  });

  it('counts days within the week', () => {
    expect(dayLabel(new Date(2026, 7, 31, 12, 0, 0), now)).toBe('3 days ago');
  });

  it('switches to a date once relative loses its usefulness', () => {
    // "13 days ago" is something a person has to translate anyway.
    expect(dayLabel(new Date(2026, 7, 21, 12, 0, 0), now)).toMatch(/Aug/);
  });
});

describe('groupByDay', () => {
  it('keeps notifications in one group per day, in order', () => {
    const groups = groupByDay(
      [
        notification({ id: 'a' }),
        notification({ id: 'b' }),
        notification({ id: 'c', createdAt: at(2, 9).toISOString() }),
      ],
      now,
    );
    expect(groups.map((group) => group.label)).toEqual(['Today', 'Yesterday']);
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('returns nothing for an empty feed', () => {
    expect(groupByDay([], now)).toEqual([]);
  });
});

describe('unreadIds', () => {
  it('selects only what has not been read', () => {
    expect(
      unreadIds([
        notification({ id: 'a' }),
        notification({ id: 'b', readAt: at(3, 10).toISOString() }),
      ]),
    ).toEqual(['a']);
  });
});

describe('badgeLabel', () => {
  it('shows nothing when everything is read', () => {
    expect(badgeLabel(0)).toBeNull();
    expect(badgeLabel(-1)).toBeNull();
  });

  it('caps at 99+, which is as much as a badge can usefully say', () => {
    expect(badgeLabel(9)).toBe('9');
    expect(badgeLabel(99)).toBe('99');
    expect(badgeLabel(100)).toBe('99+');
  });
});

describe('categorising a notification', () => {
  it('reads the product from the deep link', () => {
    // The link is the reliable signal: it has to name a real route for the
    // notification to be openable at all.
    expect(categoryOf({ template: 'anything', deepLink: '/(tabs)/ajo/abc' })).toBe('ajo');
    expect(categoryOf({ template: 'anything', deepLink: '/(tabs)/akawo/pools/1' })).toBe('akawo');
    expect(categoryOf({ template: 'anything', deepLink: '/(tabs)/food/2' })).toBe('food');
    expect(categoryOf({ template: 'anything', deepLink: '/(tabs)/bills' })).toBe('bills');
  });

  it('falls back to the template when there is no link', () => {
    // template is a free-form string on the backend, so this is a best effort
    // rather than a contract — but a notification with no link still has to be
    // drawn as something.
    expect(categoryOf({ template: 'ajo.payout.ready', deepLink: null })).toBe('ajo');
    expect(categoryOf({ template: 'payment.deposit.settled', deepLink: null })).toBe('payment');
    expect(categoryOf({ template: 'security.new_device', deepLink: null })).toBe('security');
  });

  it('prefers the link over the template when they disagree', () => {
    // Where the notification actually goes matters more than what it was
    // called, because that is what the member will see when they tap it.
    expect(categoryOf({ template: 'payment.reminder', deepLink: '/(tabs)/ajo/abc' })).toBe('ajo');
  });

  it('falls back to general rather than guessing', () => {
    expect(categoryOf({ template: 'welcome', deepLink: null })).toBe('general');
  });

  it('gives every category an icon', () => {
    const categories = ['ajo', 'akawo', 'food', 'bills', 'payment', 'security', 'general'] as const;
    for (const category of categories) {
      expect(categoryIcon(category)).toBeTruthy();
    }
  });
});

describe('the unread summary', () => {
  it("does not repeat the empty state's own wording", () => {
    // The panel beneath already says "Nothing yet"; the subtitle saying it too
    // would print the same words twice on one screen.
    expect(unreadSummary(0, 0)).toBe('Your updates appear here');
  });

  it('congratulates an inbox that has been read', () => {
    expect(unreadSummary(0, 12)).toBe('You are all caught up');
  });

  it('counts what is unread', () => {
    expect(unreadSummary(3, 12)).toBe('3 unread');
  });
});

describe('the time stamp', () => {
  it('prints a clock time, never a date', () => {
    // Every row sits under a day heading from groupByDay, so a date here would
    // repeat what the heading just said.
    const label = timeLabel(new Date('2026-09-06T14:14:00'));
    expect(label).toMatch(/\d/);
    expect(label).not.toMatch(/2026/);
  });
});
