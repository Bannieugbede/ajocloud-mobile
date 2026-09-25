import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

import { redirectSystemPath } from '@/app/+native-intent';
import JoinPoolRoute from '@/app/(tabs)/akawo/pools/join';
import FoodLinkRoute from '@/app/invite/food/[programmeId]';
import { postSignInRoute } from '@/features/auth/post-sign-in-route';
import {
  invitationCodeFromUrl,
  isProgrammeId,
  normaliseGroupCode,
  normalisePoolCode,
  normaliseProgrammeRef,
} from '@/services/incoming-link';
import { attributionFromInstallReferrer } from '@/services/install-referrer';
import {
  holdDestination,
  holdInvitation,
  takeHeldDestination,
} from '@/services/pending-invitation';
import {
  foodShareMessage,
  groupLink,
  groupShareMessage,
  poolLink,
  poolShareMessage,
  referralLink,
} from '@/services/share-links';

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
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args), push: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

let mockSignedIn = true;
jest.mock('@/services/session-storage', () => ({
  restoreSession: jest.fn(async () => (mockSignedIn ? { accessToken: 'token' } : null)),
}));

const mockPreviewFood = jest.fn(async (code: string) => {
  if (code !== '4FD5GHJ') throw new Error('not found');
  return { id: '11111111-2222-4333-8444-555555555555', shortCode: '4FD5GHJ' };
});
jest.mock('@/api/endpoints/food-ajo', () => ({
  ...jest.requireActual('@/api/endpoints/food-ajo'),
  previewFoodProgramme: (code: string) => mockPreviewFood(code),
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
  mockSignedIn = true;
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

  it.each([
    ['https://ajocloud.com/g/WHE4NTDH27?ref=AJO-7KQ3MZ', '/join/WHE4NTDH27?ref=AJO-7KQ3MZ'],
    ['ajocloud://g/7KQ3MZP', '/join/7KQ3MZP'],
    ['https://ajocloud.com/p/9PQ4RTU', '/invite/akawo/9PQ4RTU'],
    ['ajocloud://p/ABCDEFGH?ref=AJO-7KQ3MZ', '/invite/akawo/ABCDEFGH?ref=AJO-7KQ3MZ'],
    ['https://ajocloud.com/f/4FD5GHJ?x=1', '/invite/food/4FD5GHJ'],
    ['https://ajocloud.com/r/AJO-7KQ3MZ', '/join?ref=AJO-7KQ3MZ'],
    ['/g/7KQ3MZP', '/join/7KQ3MZP'],
  ])('sends the short link %s to %s', (incoming, expected) => {
    expect(redirectSystemPath({ path: incoming, initial: true })).toBe(expected);
  });

  it('reads a short path only at the start of the link', () => {
    expect(
      redirectSystemPath({ path: 'https://evil.example.com/x/g/7KQ3MZP', initial: true }),
    ).toBe('https://evil.example.com/x/g/7KQ3MZP');
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
  it('shares a pool as a short web link and the code, for someone typing it in', () => {
    expect(poolLink('ABCDEFGH')).toBe('https://ajocloud.com/p/ABCDEFGH');
    expect(poolShareMessage('Class dues', 'ABCDEFGH')).toEqual({
      message:
        'Join "Class dues" on Ajo Cloud.\nhttps://ajocloud.com/p/ABCDEFGH\nOr enter code ABCDEFGH in the app.',
      url: 'https://ajocloud.com/p/ABCDEFGH',
    });
  });

  it('never offers a listed pool’s public code as a join code to type', () => {
    expect(poolShareMessage('Class dues', '9PQ4RTU', { typeable: false }).message).toBe(
      'Join "Class dues" on Ajo Cloud.\nhttps://ajocloud.com/p/9PQ4RTU',
    );
  });

  it('shares a Food programme by its short code', () => {
    expect(foodShareMessage('Family staples', '4FD5GHJ')).toEqual({
      message:
        'Save towards "Family staples" with me on Ajo Cloud.\nhttps://ajocloud.com/f/4FD5GHJ',
      url: 'https://ajocloud.com/f/4FD5GHJ',
    });
  });

  it('shares an Ajo group as a short link, with no group id', () => {
    expect(groupLink('WHE4NTDH27')).toBe('https://ajocloud.com/g/WHE4NTDH27');
    expect(groupShareMessage('Lagos Traders', 'WHE4NTDH27').message).toBe(
      'Join "Lagos Traders" on Ajo Cloud.\nhttps://ajocloud.com/g/WHE4NTDH27',
    );
  });

  it('shares a referral as a short link', () => {
    expect(referralLink('AJO-7KQ3MZ')).toBe('https://ajocloud.com/r/AJO-7KQ3MZ');
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

  it('reads a pool link’s public code as well as its join code', () => {
    expect(normalisePoolCode('9pq4rtu')).toBe('9PQ4RTU');
  });

  it('reads a Food link by short code or by id', () => {
    expect(normaliseProgrammeRef('4fd5ghj')).toBe('4FD5GHJ');
    expect(normaliseProgrammeRef(PROGRAMME.toUpperCase())).toBe(PROGRAMME);
    expect(normaliseProgrammeRef('../food')).toBeNull();
  });

  it.each([
    ['a short invitation, as retyped', 'whe4-ntdh27', 'WHE4NTDH27'],
    ['a listed group’s public code', '7kq3mzp', '7KQ3MZP'],
    ['an invitation from before short links, kept exactly', INVITE, INVITE],
  ])('reads an Ajo link code: %s', (_label, input, expected) => {
    expect(normaliseGroupCode(input)).toBe(expected);
  });

  it.each([
    ['an ambiguous character', 'WHE4NTDH20'],
    ['the wrong length', 'WHE4NTDH2'],
    ['a path', '../..'],
  ])('refuses an Ajo link code with %s', (_label, input) => {
    expect(normaliseGroupCode(input)).toBeNull();
  });

  it('finds the code in a resumed short link, at the start of the path only', () => {
    expect(invitationCodeFromUrl('https://ajocloud.com/g/whe4ntdh27')).toBe('WHE4NTDH27');
    expect(invitationCodeFromUrl('ajocloud://g/7KQ3MZP')).toBe('7KQ3MZP');
    expect(invitationCodeFromUrl('https://evil.example.com/x/g/7KQ3MZP')).toBeNull();
  });

  it('reads short codes from a Play install referrer', () => {
    expect(
      attributionFromInstallReferrer('ajocloud_invite=whe4ntdh27&ajocloud_ref=AJO-7KQ3MZ'),
    ).toMatchObject({ invitationCode: 'WHE4NTDH27', referralCode: 'AJO-7KQ3MZ' });
    expect(attributionFromInstallReferrer('ajocloud_food=4FD5GHJ').programmeId).toBe('4FD5GHJ');
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

describe('a Food Ajo link reached by short code', () => {
  it('exchanges the code for the programme and opens it', async () => {
    mockParams = { programmeId: '4fd5ghj' };
    await render(<FoodLinkRoute />);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(tabs)/food/[programmeId]',
        params: { programmeId: PROGRAMME },
      }),
    );
    expect(mockPreviewFood).toHaveBeenCalledWith('4FD5GHJ');
  });

  it('holds the resolved programme, not the code, across sign-in', async () => {
    mockSignedIn = false;
    mockParams = { programmeId: '4FD5GHJ' };
    await render(<FoodLinkRoute />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in'));
    await expect(takeHeldDestination()).resolves.toEqual({ kind: 'food', programmeId: PROGRAMME });
  });

  it('goes to the Food tab when the programme is not open', async () => {
    mockParams = { programmeId: '9ZZ9ZZZ' };
    await render(<FoodLinkRoute />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/food'));
  });

  it('opens a programme from an older link by id, without a lookup', async () => {
    mockParams = { programmeId: PROGRAMME };
    await render(<FoodLinkRoute />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockPreviewFood).not.toHaveBeenCalled();
  });
});
