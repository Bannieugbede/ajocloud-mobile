import { apiClient } from '@/api/client/api-client';

/** Channels the backend currently accepts. PUSH and IN_APP exist in the schema
    but nothing delivers on them, so they are not offered. */
export type NotificationChannel = 'EMAIL' | 'SMS';

/**
 * The closed set of topics a user can control. Security and account-recovery
 * mail is deliberately absent: it cannot be declined, so showing a switch for
 * it would promise control that does not exist.
 */
export type NotificationTopic =
  | 'ajo.contribution'
  | 'ajo.payout'
  | 'ajo.membership'
  | 'akawo.progress'
  | 'food.distribution'
  | 'bills.receipt'
  | 'wallet.activity'
  | 'kyc.status';

export type NotificationPreference = {
  topic: NotificationTopic;
  channel: NotificationChannel;
  enabled: boolean;
  /** Minutes from midnight in `timezone`, or null when no window is set. */
  quietHoursStartMinutes: number | null;
  quietHoursEndMinutes: number | null;
  timezone: string;
};

export type NotificationPreferences = {
  preferences: NotificationPreference[];
  timezone: string;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return client().request('/api/v1/users/me/notification-preferences');
}

export type NotificationPreferenceUpdate = {
  topic: NotificationTopic;
  channel: NotificationChannel;
  enabled: boolean;
  quietHoursStartMinutes?: number | null;
  quietHoursEndMinutes?: number | null;
  timezone?: string;
};

export function updateNotificationPreferences(
  preferences: NotificationPreferenceUpdate[],
): Promise<NotificationPreferences> {
  return client().request('/api/v1/users/me/notification-preferences', {
    method: 'PUT',
    body: { preferences },
  });
}
