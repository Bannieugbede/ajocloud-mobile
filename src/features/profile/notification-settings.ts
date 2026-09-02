import type {
  NotificationChannel,
  NotificationPreference,
  NotificationPreferenceUpdate,
  NotificationTopic,
} from '@/api/endpoints/notification-preferences';

/** How each topic is described to a person, rather than showing `ajo.payout`. */
const TOPIC_LABELS: Record<NotificationTopic, { title: string; description: string }> = {
  'ajo.contribution': {
    title: 'Contribution reminders',
    description: 'When a contribution is due or was missed',
  },
  'ajo.payout': {
    title: 'Ajo payouts',
    description: 'When it is your turn to collect',
  },
  'ajo.membership': {
    title: 'Group invitations',
    description: 'When someone invites you to a group',
  },
  'akawo.progress': {
    title: 'Savings goals',
    description: 'Progress towards a goal and when you reach it',
  },
  'food.distribution': {
    title: 'Food collection',
    description: 'When your food is ready to collect',
  },
  'bills.receipt': {
    title: 'Bill receipts',
    description: 'Confirmation after a bill is paid',
  },
  'wallet.activity': {
    title: 'Wallet activity',
    description: 'Money added to or sent from your wallet',
  },
  'kyc.status': {
    title: 'Verification updates',
    description: 'The outcome of an identity check',
  },
};

/** The order topics are shown in: what people act on most, first. */
const TOPIC_ORDER: NotificationTopic[] = [
  'ajo.contribution',
  'ajo.payout',
  'wallet.activity',
  'food.distribution',
  'akawo.progress',
  'bills.receipt',
  'ajo.membership',
  'kyc.status',
];

export type TopicRow = {
  topic: NotificationTopic;
  title: string;
  description: string;
  email: boolean;
  sms: boolean;
};

/**
 * Turns the flat grid the API returns into one row per topic.
 *
 * The API answers per topic *and* channel, which is the right shape to store
 * but the wrong one to read: a person thinks "tell me about payouts", then
 * picks how. A missing entry counts as on, matching the server's opt-out rule.
 */
export function toTopicRows(preferences: NotificationPreference[]): TopicRow[] {
  return TOPIC_ORDER.map((topic) => {
    const labels = TOPIC_LABELS[topic];
    const forTopic = preferences.filter((preference) => preference.topic === topic);
    const enabledFor = (channel: NotificationChannel) =>
      forTopic.find((preference) => preference.channel === channel)?.enabled ?? true;
    return {
      topic,
      title: labels.title,
      description: labels.description,
      email: enabledFor('EMAIL'),
      sms: enabledFor('SMS'),
    };
  });
}

/** The update payload for one toggle, leaving the other channel untouched. */
export function toggleUpdate(
  row: TopicRow,
  channel: NotificationChannel,
  enabled: boolean,
): NotificationPreferenceUpdate[] {
  return [{ topic: row.topic, channel, enabled }];
}

/**
 * Quiet hours as stored: minutes from midnight. Both ends travel together,
 * because one end alone describes no window and the server rejects it.
 */
export function quietHoursUpdates(
  rows: TopicRow[],
  window: { startMinutes: number; endMinutes: number } | null,
): NotificationPreferenceUpdate[] {
  return rows.flatMap((row) =>
    (['EMAIL', 'SMS'] as const).map((channel) => ({
      topic: row.topic,
      channel,
      enabled: channel === 'EMAIL' ? row.email : row.sms,
      quietHoursStartMinutes: window ? window.startMinutes : null,
      quietHoursEndMinutes: window ? window.endMinutes : null,
    })),
  );
}

/** `1350` becomes `22:30`. */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * The quiet window currently in force, if every topic agrees on one.
 *
 * Returns null when preferences disagree, so the screen shows "off" rather than
 * picking one row's window and silently applying it to everything on save.
 */
export function currentQuietWindow(
  preferences: NotificationPreference[],
): { startMinutes: number; endMinutes: number } | null {
  const windows = preferences
    .filter(
      (preference) =>
        preference.quietHoursStartMinutes !== null && preference.quietHoursEndMinutes !== null,
    )
    .map(
      (preference) =>
        `${String(preference.quietHoursStartMinutes)}-${String(preference.quietHoursEndMinutes)}`,
    );
  if (windows.length === 0) return null;
  const distinct = new Set(windows);
  if (distinct.size > 1 || windows.length !== preferences.length) return null;
  const first = preferences[0];
  if (!first || first.quietHoursStartMinutes === null || first.quietHoursEndMinutes === null) {
    return null;
  }
  return {
    startMinutes: first.quietHoursStartMinutes,
    endMinutes: first.quietHoursEndMinutes,
  };
}

/** A plain-language summary of the window, for the settings row. */
export function quietHoursLabel(
  window: { startMinutes: number; endMinutes: number } | null,
): string {
  if (!window) return 'Off';
  return `${formatMinutes(window.startMinutes)} to ${formatMinutes(window.endMinutes)}`;
}
