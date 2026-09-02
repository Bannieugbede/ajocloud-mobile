import { router } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/endpoints/notifications';
import type { InAppNotification } from '@/api/endpoints/notifications';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { NotificationsInboxScreen } from '@/features/notifications/notifications-inbox-screen';
import { safeDeepLink } from '@/services/notification-handler';

export default function NotificationsRoute() {
  const queryClient = useQueryClient();
  // Captured once: Date.now during render is impure and would shift the day
  // labels on every re-render.
  const [now] = useState(() => new Date());

  const feed = useQuery({ queryKey: ['notification-feed'], queryFn: () => getNotificationFeed() });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notification-feed'] });
  };
  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  if (feed.isPending) return <AppLoadingState label="Loading your notifications" />;
  if (feed.isError || !feed.data) {
    return (
      <AppErrorState
        description="Could not load your notifications."
        onRetry={() => void feed.refetch()}
      />
    );
  }

  const open = (notification: InAppNotification) => {
    if (notification.readAt === null) markRead.mutate(notification.id);
    // Only an in-app path is followed; the guard rejects anything else.
    const link = safeDeepLink({ deepLink: notification.deepLink });
    if (link) router.push(link as never);
  };

  return (
    <NotificationsInboxScreen
      notifications={feed.data.items}
      unreadCount={feed.data.unreadCount}
      now={now}
      refreshing={feed.isRefetching}
      onRefresh={() => void feed.refetch()}
      onOpen={open}
      onMarkAllRead={() => markAll.mutate()}
    />
  );
}
