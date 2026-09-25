import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

import { redirectSystemPath } from '@/app/+native-intent';
import JoinPoolRoute from '@/app/(tabs)/akawo/pools/join';
import { postSignInRoute } from '@/features/auth/post-sign-in-route';
import { isProgrammeId, normalisePoolCode } from '@/services/incoming-link';
import {
  holdDestination,
  holdInvitation,
  takeHeldDestination,
} from '@/services/pending-invitation';
import { foodShareMessage, poolLink, poolShareMessage } from '@/services/share-links';

jest.mock('@/config/environment', () => ({
  environment: { EXPO_PUBLIC_WEB_URL: 'https://ajocloud.com/' },
}));

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

let mockParams: Record<string, string | undefined> = {};
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

const mockPreviewPool = jest.fn(async (_code: string) => ({
  id: 'pool-1',
  name: 'Class of 2026 dues',
  purpose: null,
  amountMinor: '500000',
  currency: 'NGN',
  referenceLabel: 'Matric number',
  dueAt: null,
  organiserName: 'Tunde Bello',
}));
jest.mock('@/api/endpoints/akawo-pools', () => ({
  previewPool: (code: string) => mockPreviewPool(code),
  joinAkawoPool: jest.fn(),
}));

// The screen's own rendering is covered elsewhere; here only its inputs matter.
const mockScreenProps = jest.fn();
jest.mock('@/features/akawo/join-pool-screen', () => ({
  JoinPoolScreen: (props: Record<string, unknown>) => {
    mockScreenProps(props);
    return null;
  },
}));

const INVITE = 'q7Xv3nRk2LpZ8sWt4YbG1mHc6dJfN0uA9eKiOxPzQrE';
const PROGRAMME = '11111111-2222-4333-8444-555555555555';

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.clear();
  mockParams = {};
});

describe('links the system hands the app', () => {
  it.each([
    ['https://ajocloud.com/akawo/join/ABCDEFGH', '/invite/akawo/ABCDEFGH'],
    ['ajocloud://akawo/join/ABCDEFGH?ref=AJO-7KQ3MZ', '/invite/akawo/ABCDEFGH?ref=AJO-7KQ3MZ'],
    [`https://ajocloud.com/food/${PROGRAMME}`, `/invite/food/${PROGRAMME}`],
    [`ajocloud://food/${PROGRAMME}?ref=AJO-7KQ3MZ&x=1`, `/invite/food/${PROGRAMME}?ref=AJO-7KQ3MZ`],
  ])('sends %s to %s', (incoming, expected) => {
    expect(redirectSystemPath({ path: incoming, initial: true })).toBe(expected);
  });

  it('carries only the referral from a link query, nothing else', () => {
    expect(
      redirectSystemPath({ path: 'ajocloud://akawo/join/ABCDEFGH?next=/wallet', initial: true }),
    ).toBe('/invite/akawo/ABCDEFGH');
  });

  it("leaves the app's own paths, and other links, alone", () => {
    expect(redirectSystemPath({ path: `/join/${INVITE}`, initial: true })).toBe(`/join/${INVITE}`);
    expect(redirectSystemPath({ path: '/food/not-an-id', initial: true })).toBe('/food/not-an-id');
  });

  it('still sends the OAuth return to sign-in', () => {
    expect(redirectSystemPath({ path: 'ajocloud:///auth/google?code=x', initial: true })).toBe(
      '/sign-in',
    );
  });
});

describe('what members share', () => {
  it('shares a pool as a web link and the code, for someone typing it in', () => {
    expect(poolLink('ABCDEFGH')).toBe('https://ajocloud.com/akawo/join/ABCDEFGH');
    expect(poolShareMessage('Class dues', 'ABCDEFGH')).toBe(
      'Join "Class dues" on Ajo Cloud.\nhttps://ajocloud.com/akawo/join/ABCDEFGH\nOr enter code ABCDEFGH in the app.',
    );
  });

  it('shares a Food programme as a web link', () => {
    expect(foodShareMessage('Family staples', PROGRAMME)).toBe(
      `Save towards "Family staples" with me on Ajo Cloud.\nhttps://ajocloud.com/food/${PROGRAMME}`,
    );
  });
});

describe('codes in links', () => {
  it('reads a pool code the way the backend compares them', () => {
    expect(normalisePoolCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(normalisePoolCode('ABCDEFG0')).toBeNull();
    expect(normalisePoolCode('ABCDEFG')).toBeNull();
    expect(normalisePoolCode(42)).toBeNull();
  });

  it('recognises a programme id', () => {
    expect(isProgrammeId(PROGRAMME)).toBe(true);
    expect(isProgrammeId('../food')).toBe(false);
  });
});

describe('resuming after sign-in', () => {
  it('returns to an Ajo invitation', async () => {
    await holdInvitation(INVITE);
    await expect(postSignInRoute()).resolves.toEqual({
      pathname: '/join/[code]',
      params: { code: INVITE },
    });
  });

  it('returns to an Akawo pool, on the join screen', async () => {
    await holdDestination({ kind: 'akawo', code: 'ABCDEFGH' });
    await expect(postSignInRoute()).resolves.toEqual({
      pathname: '/(tabs)/akawo/pools/join',
      params: { code: 'ABCDEFGH' },
    });
  });

  it('returns to a Food programme', async () => {
    await holdDestination({ kind: 'food', programmeId: PROGRAMME });
    await expect(postSignInRoute()).resolves.toEqual({
      pathname: '/(tabs)/food/[programmeId]',
      params: { programmeId: PROGRAMME },
    });
  });

  it('offers a held destination once', async () => {
    await holdDestination({ kind: 'akawo', code: 'ABCDEFGH' });
    await postSignInRoute();
    await expect(postSignInRoute()).resolves.toEqual({ pathname: '/(tabs)/home' });
  });

  it('still reads an invitation saved before pools and programmes could be held', async () => {
    await SecureStore.setItemAsync(
      'ajo-cloud-pending-invitation',
      JSON.stringify({ code: INVITE, savedAt: new Date().toISOString() }),
    );
    await expect(takeHeldDestination()).resolves.toEqual({ kind: 'ajo', code: INVITE });
  });

  it('refuses a stored destination that was tampered with', async () => {
    await SecureStore.setItemAsync(
      'ajo-cloud-pending-invitation',
      JSON.stringify({ kind: 'food', programmeId: '../wallet', savedAt: new Date().toISOString() }),
    );
    await expect(takeHeldDestination()).resolves.toBeNull();
  });
});

function withQueryClient(element: React.ReactElement) {
  // gcTime: Infinity schedules no garbage-collection timer, which would
  // otherwise keep Jest alive after the run.
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return <QueryClientProvider client={client}>{element}</QueryClientProvider>;
}

describe('the pool join screen reached from a link', () => {
  it('fills in and looks up the linked code on arrival', async () => {
    mockParams = { code: 'abcd-efgh' };
    await render(withQueryClient(<JoinPoolRoute />));
    await waitFor(() => expect(mockPreviewPool).toHaveBeenCalledWith('ABCDEFGH'));
    expect(mockPreviewPool).toHaveBeenCalledTimes(1);
    expect(mockScreenProps).toHaveBeenCalledWith(
      expect.objectContaining({ initialCode: 'ABCDEFGH' }),
    );
  });

  it('ignores a linked value that is not a code', async () => {
    mockParams = { code: '../../wallet' };
    await render(withQueryClient(<JoinPoolRoute />));
    expect(mockPreviewPool).not.toHaveBeenCalled();
  });
});
