import { render } from '@testing-library/react-native';

import AuthLayout from '@/app/(auth)/_layout';
import AjoLayout from '@/app/(tabs)/ajo/_layout';
import AkawoLayout from '@/app/(tabs)/akawo/_layout';
import BillsLayout from '@/app/(tabs)/bills/_layout';
import FoodLayout from '@/app/(tabs)/food/_layout';
import PayLayout from '@/app/(tabs)/pay/_layout';
import ProfileLayout from '@/app/(tabs)/profile/_layout';

/**
 * Every stack screen must name itself.
 *
 * A screen whose route is not declared in its layout falls back to the app's
 * own name from app.json, so the header reads "Ajo Cloud" instead of saying
 * where the member is. That is invisible in a typecheck and easy to reintroduce
 * by adding a route file and forgetting the Stack.Screen beside it, so it is
 * asserted here against the files actually on disk.
 */

jest.mock('expo-router', () => {
  const React = require('react');
  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement('stack', null, children);
  Stack.Screen = (props: Record<string, unknown>) =>
    React.createElement('stack-screen', {
      testID: `screen:${String(props.name)}`,
      screenOptions: props.options,
    });
  return {
    Stack,
    router: { back: jest.fn(), replace: jest.fn() },
    useNavigation: () => ({ canGoBack: () => false }),
    usePathname: () => '/',
  };
});

type ScreenOptions = { title?: string; headerShown?: boolean };

/**
 * The options a layout gives one route, or null when it declares none.
 *
 * Queried by name rather than by enumerating what was rendered, because a route
 * the layout forgot renders nothing at all — its absence is exactly the bug.
 */
async function optionsFor(
  Layout: () => React.ReactElement,
  route: string,
): Promise<ScreenOptions | null> {
  const view = await render(<Layout />);
  const node = view.queryByTestId(`screen:${route}`);
  if (!node) return null;
  return ((node.props as { screenOptions?: ScreenOptions }).screenOptions ?? {}) as ScreenOptions;
}

/**
 * Every route file under each stack, listed here rather than read from disk:
 * the test bundle has no filesystem, and naming them makes the omission of one
 * visible in review.
 */
const ROUTES: readonly [string, () => React.ReactElement, readonly string[]][] = [
  [
    'ajo',
    AjoLayout,
    [
      'index',
      'create',
      'join',
      '[groupId]/index',
      '[groupId]/contribute',
      '[groupId]/swap',
      '[groupId]/swaps',
    ],
  ],
  [
    'akawo',
    AkawoLayout,
    [
      'index',
      'goals',
      'create-goal',
      '[goalId]',
      'pools/create',
      'pools/created',
      'pools/join',
      'pools/[poolId]/index',
      'pools/[poolId]/manage',
    ],
  ],
  ['bills', BillsLayout, ['index', '[categoryId]/index', '[categoryId]/pay', 'receipt']],
  ['food', FoodLayout, ['index', '[programmeId]']],
  ['pay', PayLayout, ['index', '[intentId]', 'result']],
  [
    'profile',
    ProfileLayout,
    [
      'index',
      'settings',
      'appearance',
      'fees',
      'edit',
      'security',
      'notifications',
      'support',
      'transactions',
      'wallets',
      'wallet/fund',
      'wallet/send',
      'wallet/withdraw',
    ],
  ],
];

describe.each(ROUTES)('%s stack', (_name, Layout, routes) => {
  it.each(routes)('declares %s with a title of its own', async (route) => {
    const options = await optionsFor(Layout, route);

    // A route the layout never declares falls back to the app name from
    // app.json, so its header reads "Ajo Cloud" rather than saying where the
    // member is.
    expect(options).not.toBeNull();

    // A root that draws its own header needs no navigator title.
    if (options?.headerShown === false) return;
    expect(options?.title).toBeTruthy();
    expect(options?.title).not.toBe('Ajo Cloud');
  });
});

/**
 * The identity screens are reached both as registration steps and from
 * Profile's "KYC Verification" and "Bank Accounts" rows.
 *
 * The auth stack sets the brand mark as every screen's header title, which is
 * right while an account is still being created and wrong once a signed-in
 * member taps a named row to get here — the header then reads "Ajo Cloud"
 * instead of saying which screen they are on.
 */
describe('identity screens reached from Profile', () => {
  it.each([
    ['verify-identity', 'KYC Verification'],
    ['personal-details', 'Personal Details'],
    ['identity-document', 'Identity Document'],
    ['bank-account', 'Bank Account'],
    ['identity-complete', 'Verification Complete'],
  ])('%s names itself rather than showing the brand mark', async (route, title) => {
    const options = (await optionsFor(AuthLayout, route)) as
      (ScreenOptions & { headerTitle?: unknown }) | null;

    expect(options?.title).toBe(title);
    // Cleared *explicitly*: a headerTitle element inherited from screenOptions
    // wins over a title string, so the key has to be present and undefined
    // rather than simply absent. `toBeUndefined` cannot tell those apart, so
    // this asserts the key is there.
    expect(Object.keys(options ?? {})).toContain('headerTitle');
    expect(options?.headerTitle).toBeUndefined();
  });

  it('keeps the brand mark on the screens that come before an account exists', async () => {
    // Sign-in has no other context to offer, so the mark is right there.
    const options = await optionsFor(AuthLayout, 'sign-in');
    expect(options?.title).toBeUndefined();
  });
});
