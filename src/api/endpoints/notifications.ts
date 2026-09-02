import { apiClient } from '@/api/client/api-client';

export type InAppNotification = {
  id: string;
  template: string;
  title: string | null;
  body: string | null;
  /** In-app path to open on tap. Never an external URL. */
  deepLink: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationFeed = {
  items: InAppNotification[];
  nextCursor: string | null;
  unreadCount: number;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function getNotificationFeed(cursor?: string): Promise<NotificationFeed> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return client().request(`/api/v1/notifications${query}`);
}

export function markNotificationRead(
  notificationId: string,
): Promise<{ id: string; readAt: string }> {
  return client().request(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  });
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return client().request('/api/v1/notifications/read-all', { method: 'POST' });
}
