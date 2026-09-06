import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { getNotificationFeed } from '@/api/endpoints/notifications';
import { SettingsScreen } from '@/features/profile/settings-screen';

export default function SettingsRoute() {
  // Read here too, so the inbox row carries its unread count without the user
  // having to open it to find out there is something waiting.
  const feed = useQuery({ queryKey: ['notification-feed'], queryFn: () => getNotificationFeed() });

  return (
    <SettingsScreen
      unreadCount={feed.data?.unreadCount ?? 0}
      onEditProfile={() => router.push('/(tabs)/profile/edit')}
      onOpenSecurity={() => router.push('/(tabs)/profile/security')}
      onOpenNotifications={() => router.push('/(tabs)/profile/notifications')}
      onOpenInbox={() => router.push('/(tabs)/notifications')}
      onOpenLegal={() => router.push('/(public)/legal/privacy')}
    />
  );
}
