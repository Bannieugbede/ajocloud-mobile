import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import {
  getNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/endpoints/notifications';
import type { InAppNotification } from '@/api/endpoints/notifications';
import { NotificationsInboxScreen } from '@/features/notifications/notifications-inbox-screen';
import { safeDeepLink } from '@/services/notification-handler';

export default function NotificationsRoute() {
  const queryClient = useQueryClient();
  // Captured once: Date.now during render is impure and would shift the day
  // labels on every re-render.
  const [now] = useState(() => new Date());

  // Paged, because the feed returns a cursor and an account a few months old
  // has more updates than one response carries. Without this the older ones
  // were simply unreachable.
  const feed = useInfiniteQuery({
    queryKey: ['notification-feed'],
    queryFn: ({ pageParam }) => getNotificationFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notification-feed'] });
  };
  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  const pages = feed.data?.pages ?? [];
  const notifications = pages.flatMap((page) => page.items);
  // The count comes from the first page: it is the account's total, not this
  // page's, so a later page would report the same number again.
  const unreadCount = pages[0]?.unreadCount ?? 0;

  const open = (notification: InAppNotification) => {
    if (notification.readAt === null) markRead.mutate(notification.id);
    // Only an in-app path is followed; the guard rejects anything else.
    const link = safeDeepLink({ deepLink: notification.deepLink });
    if (link) router.push(link as never);
  };

  return (
    <NotificationsInboxScreen
      notifications={notifications}
      unreadCount={unreadCount}
      now={now}
      loading={feed.isPending}
      error={feed.isError}
      refreshing={feed.isRefetching && !feed.isFetchingNextPage}
      loadingMore={feed.isFetchingNextPage}
      hasMore={feed.hasNextPage}
      onRefresh={() => void feed.refetch()}
      onRetry={() => void feed.refetch()}
      onLoadMore={() => void feed.fetchNextPage()}
      onOpen={open}
      onMarkAllRead={() => markAll.mutate()}
      onOpenSettings={() => router.push('/(tabs)/profile/notifications')}
    />
  );
}
