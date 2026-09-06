import { act, fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { AppHeaderBack, backTo } from '@/components/ui/app-header-back';

const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
  useNavigation: () => ({ canGoBack: () => mockCanGoBack() as boolean }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('the header back control', () => {
  it('goes back through real history when there is any', async () => {
    mockCanGoBack.mockReturnValue(true);
    const view = await render(<AppHeaderBack fallback="/(tabs)/home" />);

    await act(async () => fireEvent.press(view.getByLabelText('Go back')));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falls back to the containing screen when there is none', async () => {
    // Switching tabs does not push, so a screen opened from another tab has no
    // history and would otherwise render no back button at all.
    mockCanGoBack.mockReturnValue(false);
    const view = await render(<AppHeaderBack fallback="/(tabs)/home" />);

    await act(async () => fireEvent.press(view.getByLabelText('Go back')));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('is reachable at the full touch target', async () => {
    const view = await render(<AppHeaderBack fallback="/(tabs)/home" />);
    const button = view.getByTestId('header-back-button');
    const style = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;

    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
  });

  it('replaces the native control rather than sitting beside it', () => {
    // Two chevrons on one header is worse than none: the member cannot tell
    // which one returns them where.
    expect(backTo('/(tabs)/home').headerBackVisible).toBe(false);
    expect(typeof backTo('/(tabs)/home').headerLeft).toBe('function');
  });
});
