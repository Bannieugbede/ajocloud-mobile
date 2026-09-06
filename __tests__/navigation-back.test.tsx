import { render } from '@testing-library/react-native';

import BillsLayout from '@/app/(tabs)/bills/_layout';
import PayLayout from '@/app/(tabs)/pay/_layout';

/**
 * Stack and Stack.Screen are replaced with markers that record their props, so
 * the options each screen is given can be read without a real navigator.
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
  };
});

/**
 * Guards every screen reached from another tab against shipping with no way
 * back.
 *
 * Expo Router draws a native back button only when a screen was pushed onto the
 * stack it belongs to. Switching tabs does not push, so a screen opened from
 * another tab — Home to Bills, a pool to the shared payment flow — arrives with
 * no history and no back control, leaving the member only the tab bar, which
 * does not return them where they came from.
 *
 * These render the layout and inspect the options it gives each screen, so what
 * is asserted is the option object the navigator will actually receive.
 */

type ScreenOptions = { headerLeft?: unknown; headerBackVisible?: boolean; title?: string };

/** The options a layout gives one of its screens. */
async function optionsFor(Layout: () => React.ReactElement, name: string): Promise<ScreenOptions> {
  const view = await render(<Layout />);
  return (
    (view.getByTestId(`screen:${name}`).props as { screenOptions?: ScreenOptions }).screenOptions ??
    {}
  );
}

describe('screens reached from another tab', () => {
  it.each([
    ['the bills list', BillsLayout, 'index'],
    ['the payment flow', PayLayout, 'index'],
  ])('%s supplies its own back control', async (_name, Layout, screen) => {
    const options = await optionsFor(Layout as () => React.ReactElement, screen);

    expect(typeof options.headerLeft).toBe('function');
    // Replaces the native control rather than sitting beside it: two chevrons
    // on one header is worse than none.
    expect(options.headerBackVisible).toBe(false);
  });
});

describe('post-submit screens', () => {
  it('suppresses back on a receipt, which must not return to the form', async () => {
    // Going back to a form that has already been charged invites a second
    // payment. Each of these offers a Done button instead.
    expect((await optionsFor(BillsLayout, 'receipt')).headerBackVisible).toBe(false);
    expect((await optionsFor(PayLayout, 'result')).headerBackVisible).toBe(false);
  });
});
