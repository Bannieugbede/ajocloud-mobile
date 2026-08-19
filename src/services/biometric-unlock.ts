import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'none';

export type BiometricAvailability = {
  /** The device has the sensor and at least one enrolled biometric. */
  available: boolean;
  kind: BiometricKind;
  /** Human label for the strongest available method, e.g. "Face ID". */
  label: string;
};

/**
 * What this device can actually offer. Hardware presence is not enough: a
 * sensor with nothing enrolled cannot authenticate, so both are checked.
 */
export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  const kind = strongestKind(types);
  return {
    available: hasHardware && isEnrolled && kind !== 'none',
    kind,
    label: labelFor(kind),
  };
}

/**
 * Prompts for a local biometric check. Returns whether it succeeded; the caller
 * decides what that unlocks. This never authenticates against the backend — a
 * biometric match only releases a session already held on this device.
 */
export async function authenticateWithBiometrics(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    // Falling back to the device passcode keeps the user from being locked out
    // when a finger is wet or the camera is obstructed.
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  return result.success;
}

function strongestKind(types: readonly LocalAuthentication.AuthenticationType[]): BiometricKind {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
  return 'none';
}

function labelFor(kind: BiometricKind): string {
  switch (kind) {
    case 'face':
      return Platform.OS === 'ios' ? 'Face ID' : 'face unlock';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'fingerprint';
    case 'iris':
      return 'iris unlock';
    default:
      return 'biometric unlock';
  }
}
