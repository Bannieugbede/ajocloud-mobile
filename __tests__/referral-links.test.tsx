import { fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';

import IntentRoute from '@/app/(auth)/intent';
import ReferralLinkRoute from '@/app/join/index';
import { useInstallAttribution } from '@/hooks/use-install-attribution';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
  useLocalSearchParams: () => mockParams,
}));

const mockHoldReferral = jest.fn(async (_code: string) => undefined);
jest.mock('@/services/pending-referral', () => ({
  holdReferral: (code: string) => mockHoldReferral(code),
}));

const mockRestoreSession = jest.fn(async (): Promise<object | null> => null);
jest.mock('@/services/session-storage', () => ({
  restoreSession: () => mockRestoreSession(),
}));

const mockPostSignInRoute = jest.fn();
jest.mock('@/features/auth/post-sign-in-route', () => ({
  postSignInRoute: () => mockPostSignInRoute(),
}));

// The step's own form is covered elsewhere; here only its exit matters.
jest.mock('@/features/registration/intent-step', () => {
  const { Pressable, Text } = require('react-native');
  return {
    IntentStep: ({ onContinue }: { onContinue: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onContinue}>
        <Text>Continue</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/store/registration-store', () => ({
  useRegistrationStore: (select: (state: { finish: () => void }) => unknown) =>
    select({ finish: jest.fn() }),
}));

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
}));

const mockGetInstallReferrer = jest.fn(async () => '');
jest.mock('expo-application', () => ({
  getInstallReferrerAsync: () => mockGetInstallReferrer(),
}));

const INVITE = 'q7Xv3nRk2LpZ8sWt4YbG1mHc6dJfN0uA9eKiOxPzQrE';

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockStore.clear();
});

describe('a referral link', () => {
  it('holds the code and sends someone without an account to sign up', async () => {
    mockParams = { ref: 'ajo-7kq3mz' };
    await render(<ReferralLinkRoute />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/register'));
    expect(mockHoldReferral).toHaveBeenCalledWith('ajo-7kq3mz');
  });

  it('sends someone already signed in home, since they have nothing to apply it to', async () => {
    mockParams = { ref: 'AJO-7KQ3MZ' };
    mockRestoreSession.mockResolvedValueOnce({ accessToken: 'x' });
    await render(<ReferralLinkRoute />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home'));
  });

  it('still reaches sign-up when the link has no code', async () => {
    await render(<ReferralLinkRoute />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/register'));
    expect(mockHoldReferral).not.toHaveBeenCalled();
  });
});

describe('the end of sign-up', () => {
  it('returns to a held invitation instead of the home tab', async () => {
    const destination = { pathname: '/join/[code]', params: { code: INVITE } };
    mockPostSignInRoute.mockResolvedValueOnce(destination);
    const view = await render(<IntentRoute />);
    fireEvent.press(view.getByRole('button'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(destination));
  });

  it('still reaches home when the held invitation cannot be read', async () => {
    mockPostSignInRoute.mockRejectedValueOnce(new Error('keychain locked'));
    const view = await render(<IntentRoute />);
    fireEvent.press(view.getByRole('button'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(tabs)/home' }));
  });
});

describe('a Play Store install from the website', () => {
  const { Platform } = jest.requireActual<typeof import('react-native')>('react-native');
  const originalOS = Platform.OS;

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS });
  });

  it('opens the invitation and holds the referral on first launch', async () => {
    mockGetInstallReferrer.mockResolvedValueOnce(
      `utm_source=google-play&ajocloud_invite=${INVITE}&ajocloud_ref=AJO-7KQ3MZ`,
    );
    await renderHook(() => useInstallAttribution());
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/join/[code]', params: { code: INVITE } }),
    );
    expect(mockHoldReferral).toHaveBeenCalledWith('AJO-7KQ3MZ');
  });

  it('opens an Akawo pool passed through Play', async () => {
    mockGetInstallReferrer.mockResolvedValueOnce('ajocloud_pool=ABCDEFGH');
    await renderHook(() => useInstallAttribution());
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/invite/akawo/[code]',
        params: { code: 'ABCDEFGH' },
      }),
    );
  });

  it('opens a Food Ajo programme passed through Play', async () => {
    const programmeId = '11111111-2222-4333-8444-555555555555';
    mockGetInstallReferrer.mockResolvedValueOnce(`ajocloud_food=${programmeId}`);
    await renderHook(() => useInstallAttribution());
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/invite/food/[programmeId]',
        params: { programmeId },
      }),
    );
  });

  it('acts only once per installation', async () => {
    mockStore.set('ajo-cloud-install-referrer-read', '2026-09-01T00:00:00.000Z');
    mockGetInstallReferrer.mockResolvedValue(`ajocloud_invite=${INVITE}`);
    await renderHook(() => useInstallAttribution());
    // Give the effect's promise chain a chance to run.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(mockGetInstallReferrer).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('carries on as a fresh install when Play has no referrer', async () => {
    mockGetInstallReferrer.mockRejectedValueOnce(new Error('not installed from Play'));
    await renderHook(() => useInstallAttribution());
    await waitFor(() => expect(mockStore.get('ajo-cloud-install-referrer-read')).toBeDefined());
    expect(mockPush).not.toHaveBeenCalled();
  });
});
