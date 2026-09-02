import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';

import { registerDevice, type RegisterDeviceInput } from '@/api/endpoints/devices';

const FINGERPRINT_KEY = 'ajo-cloud-device-fingerprint';

/**
 * Android requires a channel to exist before a push token can be obtained, and
 * the channel determines how the notification actually behaves on the device.
 */
const DEFAULT_CHANNEL_ID = 'default';

/**
 * A stable identifier for this installation.
 *
 * Generated once and kept in secure storage rather than derived from hardware:
 * device identifiers are restricted on both platforms, change across
 * reinstalls anyway, and would make the record more identifying than it needs
 * to be. Losing it simply registers a new device, which is the honest outcome
 * — the app really is a fresh installation at that point.
 */
export async function deviceFingerprint(): Promise<string> {
  const existing = await SecureStore.getItemAsync(FINGERPRINT_KEY);
  if (existing) return existing;
  const created = randomUUID().replace(/-/g, '');
  await SecureStore.setItemAsync(FINGERPRINT_KEY, created, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return created;
}

/**
 * Asks for notification permission and returns an Expo push token.
 *
 * Returns null rather than throwing when permission is refused or the token
 * cannot be fetched: not being reachable by push is an ordinary state, not an
 * error, and it must never stop someone signing in.
 */
export async function acquirePushToken(): Promise<string | null> {
  // A simulator cannot receive a push, and asking Expo for a token there fails.
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    // Must exist before getExpoPushTokenAsync on Android.
    await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && existing.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return null;

  // Expo recommends passing projectId explicitly rather than relying on it
  // being inferred from the manifest, which is absent in some build contexts.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof projectId !== 'string') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    // This call reaches Expo's servers, so it fails when offline. The device is
    // still registered without a token and can try again on the next sign-in.
    return null;
  }
}

/**
 * Registers this installation with the backend, with a push token when one can
 * be obtained.
 *
 * Called after signing in. Every device is registered whether or not push was
 * allowed: the record is what a security review of the account reads, and a
 * device nobody knows about cannot be reviewed or signed out.
 */
export async function registerThisDevice(): Promise<{ registered: boolean; pushable: boolean }> {
  try {
    const fingerprint = await deviceFingerprint();
    const pushToken = await acquirePushToken();

    const input: RegisterDeviceInput = {
      fingerprint,
      ...(Device.deviceName ? { name: Device.deviceName } : {}),
      platform: Platform.OS,
      ...(Constants.expoConfig?.version ? { appVersion: Constants.expoConfig.version } : {}),
      ...(pushToken ? { pushToken } : { pushPermissionDeclined: true }),
    };
    await registerDevice(input);
    return { registered: true, pushable: pushToken !== null };
  } catch {
    // Registration must never block a sign-in that already succeeded. The next
    // launch retries, and the user is signed in either way.
    return { registered: false, pushable: false };
  }
}
