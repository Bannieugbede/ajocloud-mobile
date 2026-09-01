import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/**
 * Reads connectivity from TanStack Query's `onlineManager`, which `AppProviders`
 * already drives from `expo-network`. Subscribing here rather than adding a
 * second network listener keeps the UI and the query cache from ever disagreeing
 * about whether the device is online.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
