import type { NotificationPreference } from '@/api/endpoints/notification-preferences';

import {
  currentQuietWindow,
  formatMinutes,
  quietHoursLabel,
  quietHoursUpdates,
  toTopicRows,
  toggleUpdate,
} from './notification-settings';

const preference = (
  overrides: Partial<NotificationPreference> & Pick<NotificationPreference, 'topic' | 'channel'>,
): NotificationPreference => ({
  enabled: true,
  quietHoursStartMinutes: null,
  quietHoursEndMinutes: null,
  timezone: 'Africa/Lagos',
  ...overrides,
});

describe('toTopicRows', () => {
  it('collapses the channel grid into one row per topic', () => {
    const rows = toTopicRows([
      preference({ topic: 'ajo.payout', channel: 'EMAIL', enabled: false }),
      preference({ topic: 'ajo.payout', channel: 'SMS', enabled: true }),
    ]);
    const payout = rows.find((row) => row.topic === 'ajo.payout');
    expect(payout?.email).toBe(false);
    expect(payout?.sms).toBe(true);
  });

  it('treats a missing entry as on, matching the opt-out rule', () => {
    const rows = toTopicRows([]);
    expect(rows.every((row) => row.email && row.sms)).toBe(true);
  });

  it('names topics in words rather than showing their keys', () => {
    const rows = toTopicRows([]);
    expect(rows.map((row) => row.title)).not.toContain('ajo.payout');
    expect(rows.find((row) => row.topic === 'ajo.payout')?.title).toBe('Ajo payouts');
  });

  it('never offers a security topic, which cannot be declined', () => {
    const rows = toTopicRows([]);
    const titles = rows.map((row) => row.title.toLowerCase()).join(' ');
    expect(titles).not.toContain('password');
    expect(titles).not.toContain('login');
    expect(titles).not.toContain('security');
  });

  it('leads with what people act on most', () => {
    const rows = toTopicRows([]);
    expect(rows[0]?.topic).toBe('ajo.contribution');
  });
});

describe('toggleUpdate', () => {
  it('changes only the channel that was tapped', () => {
    const row = toTopicRows([])[0]!;
    const updates = toggleUpdate(row, 'SMS', false);
    expect(updates).toEqual([{ topic: row.topic, channel: 'SMS', enabled: false }]);
  });
});

describe('quietHoursUpdates', () => {
  it('carries each topic current channel state so a save cannot switch it on', () => {
    const rows = toTopicRows([
      preference({ topic: 'ajo.payout', channel: 'EMAIL', enabled: false }),
    ]);
    const updates = quietHoursUpdates(rows, { startMinutes: 22 * 60, endMinutes: 7 * 60 });
    const payoutEmail = updates.find(
      (update) => update.topic === 'ajo.payout' && update.channel === 'EMAIL',
    );
    expect(payoutEmail?.enabled).toBe(false);
  });

  it('sends both ends together, since one alone is rejected', () => {
    const updates = quietHoursUpdates(toTopicRows([]), {
      startMinutes: 22 * 60,
      endMinutes: 7 * 60,
    });
    expect(
      updates.every(
        (update) => update.quietHoursStartMinutes !== null && update.quietHoursEndMinutes !== null,
      ),
    ).toBe(true);
  });

  it('clears both ends when the window is switched off', () => {
    const updates = quietHoursUpdates(toTopicRows([]), null);
    expect(
      updates.every(
        (update) => update.quietHoursStartMinutes === null && update.quietHoursEndMinutes === null,
      ),
    ).toBe(true);
  });
});

describe('currentQuietWindow', () => {
  it('is null when nothing is configured', () => {
    expect(currentQuietWindow([])).toBeNull();
    expect(currentQuietWindow([preference({ topic: 'ajo.payout', channel: 'EMAIL' })])).toBeNull();
  });

  it('reads the window when every preference agrees', () => {
    expect(
      currentQuietWindow([
        preference({
          topic: 'ajo.payout',
          channel: 'EMAIL',
          quietHoursStartMinutes: 22 * 60,
          quietHoursEndMinutes: 7 * 60,
        }),
        preference({
          topic: 'ajo.payout',
          channel: 'SMS',
          quietHoursStartMinutes: 22 * 60,
          quietHoursEndMinutes: 7 * 60,
        }),
      ]),
    ).toEqual({ startMinutes: 22 * 60, endMinutes: 7 * 60 });
  });

  it('refuses to guess when preferences disagree', () => {
    // Showing one row's window and then applying it to everything on save
    // would change settings the person never touched.
    expect(
      currentQuietWindow([
        preference({
          topic: 'ajo.payout',
          channel: 'EMAIL',
          quietHoursStartMinutes: 22 * 60,
          quietHoursEndMinutes: 7 * 60,
        }),
        preference({
          topic: 'ajo.contribution',
          channel: 'EMAIL',
          quietHoursStartMinutes: 21 * 60,
          quietHoursEndMinutes: 6 * 60,
        }),
      ]),
    ).toBeNull();
  });

  it('refuses when only some preferences carry a window', () => {
    expect(
      currentQuietWindow([
        preference({
          topic: 'ajo.payout',
          channel: 'EMAIL',
          quietHoursStartMinutes: 22 * 60,
          quietHoursEndMinutes: 7 * 60,
        }),
        preference({ topic: 'ajo.contribution', channel: 'EMAIL' }),
      ]),
    ).toBeNull();
  });
});

describe('formatMinutes', () => {
  it('pads to a readable clock time', () => {
    expect(formatMinutes(0)).toBe('00:00');
    expect(formatMinutes(9 * 60 + 5)).toBe('09:05');
    expect(formatMinutes(22 * 60 + 30)).toBe('22:30');
  });
});

describe('quietHoursLabel', () => {
  it('says off rather than showing an empty range', () => {
    expect(quietHoursLabel(null)).toBe('Off');
  });

  it('reads as a sentence', () => {
    expect(quietHoursLabel({ startMinutes: 22 * 60, endMinutes: 7 * 60 })).toBe('22:00 to 07:00');
  });
});
