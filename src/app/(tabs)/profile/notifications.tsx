import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/endpoints/notification-preferences';
import type {
  NotificationChannel,
  NotificationPreferenceUpdate,
} from '@/api/endpoints/notification-preferences';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { NotificationsScreen } from '@/features/profile/notifications-screen';
import {
  currentQuietWindow,
  quietHoursUpdates,
  toTopicRows,
  toggleUpdate,
} from '@/features/profile/notification-settings';
import type { AppError } from '@/types/errors';

export default function NotificationsRoute() {
  const queryClient = useQueryClient();
  const preferences = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
  });

  const save = useMutation({
    mutationFn: (updates: NotificationPreferenceUpdate[]) => updateNotificationPreferences(updates),
    // The response is the full refreshed grid, so it seeds the cache directly
    // rather than triggering another round trip.
    onSuccess: (result) => queryClient.setQueryData(['notification-preferences'], result),
  });

  if (preferences.isPending) return <AppLoadingState label="Loading your notification settings" />;
  if (preferences.isError || !preferences.data) {
    return (
      <AppErrorState
        description="Could not load your notification settings."
        onRetry={() => void preferences.refetch()}
      />
    );
  }

  const rows = toTopicRows(preferences.data.preferences);

  return (
    <NotificationsScreen
      rows={rows}
      quietWindow={currentQuietWindow(preferences.data.preferences)}
      timezone={preferences.data.timezone}
      saving={save.isPending}
      error={save.error as AppError | null}
      saved={save.isSuccess}
      onToggle={(row, channel: NotificationChannel, enabled) =>
        save.mutate(toggleUpdate(row, channel, enabled))
      }
      onQuietHours={(window) => save.mutate(quietHoursUpdates(rows, window))}
    />
  );
}
