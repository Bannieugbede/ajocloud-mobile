import type { InAppNotification } from '@/api/endpoints/notifications';

import { badgeLabel, dayLabel, groupByDay, unreadIds } from './notification-list';

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
