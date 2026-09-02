import { apiClient } from '@/api/client/api-client';

export type RegisteredDevice = {
  id: string;
  fingerprint: string;
  name: string | null;
  platform: string | null;
  appVersion: string | null;
  /** When the push token was last accepted; null when this device cannot be
      reached by push. The token itself is never returned. */
  pushTokenAt: string | null;
  pushDeclinedAt: string | null;
  trustedAt: string | null;
  lastSeenAt: string;
  createdAt: string;
};

export type RegisterDeviceInput = {
  fingerprint: string;
  name?: string;
  platform?: string;
  appVersion?: string;
  pushToken?: string;
  pushPermissionDeclined?: boolean;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function registerDevice(input: RegisterDeviceInput): Promise<RegisteredDevice> {
  return client().request('/api/v1/devices', { method: 'POST', body: input });
}

export function listDevices(): Promise<RegisteredDevice[]> {
  return client().request('/api/v1/devices');
}

export function deregisterDevice(deviceId: string): Promise<{ deregistered: true }> {
  return client().request(`/api/v1/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
}
