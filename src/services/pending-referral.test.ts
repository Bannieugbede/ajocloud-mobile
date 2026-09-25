import * as SecureStore from 'expo-secure-store';

import { clearHeldReferral, holdReferral, readHeldReferral } from './pending-referral';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

const DAY = 24 * 60 * 60 * 1_000;

afterEach(async () => {
  jest.useRealTimers();
  await clearHeldReferral();
});

it('holds a code in canonical form', async () => {
  await holdReferral('ajo-7kq3mz');
  await expect(readHeldReferral()).resolves.toBe('AJO-7KQ3MZ');
});

it('keeps the code after reading it, so an abandoned sign-up can be restarted', async () => {
  await holdReferral('AJO-7KQ3MZ');
  await readHeldReferral();
  await expect(readHeldReferral()).resolves.toBe('AJO-7KQ3MZ');
});

it('does not hold something that is not a code', async () => {
  await holdReferral('../../pay');
  expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.stringContaining('pay'),
    expect.anything(),
  );
  await expect(readHeldReferral()).resolves.toBeNull();
});

it('lets a later link replace an earlier one', async () => {
  await holdReferral('AJO-7KQ3MZ');
  await holdReferral('AJO-AAAAAA');
  await expect(readHeldReferral()).resolves.toBe('AJO-AAAAAA');
});

it('forgets a code after thirty days', async () => {
  jest.useFakeTimers({ now: new Date('2026-09-01T00:00:00Z') });
  await holdReferral('AJO-7KQ3MZ');
  jest.setSystemTime(new Date(Date.parse('2026-09-01T00:00:00Z') + 31 * DAY));
  await expect(readHeldReferral()).resolves.toBeNull();
});

it('refuses a stored value that was tampered with', async () => {
  await SecureStore.setItemAsync(
    'ajo-cloud-pending-referral',
    JSON.stringify({ code: 'not a code', savedAt: new Date().toISOString() }),
  );
  await expect(readHeldReferral()).resolves.toBeNull();
});

it('refuses a stored value that is not JSON', async () => {
  await SecureStore.setItemAsync('ajo-cloud-pending-referral', '{');
  await expect(readHeldReferral()).resolves.toBeNull();
});
