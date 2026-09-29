import { router } from 'expo-router';

import { createTabRootListener, isTabRepress } from './tab-root-listener';

jest.mock('expo-router', () => ({
  router: { dismissTo: jest.fn() },
}));

const dismissTo = router.dismissTo as jest.Mock;

beforeEach(() => {
  dismissTo.mockClear();
});

describe('isTabRepress', () => {
  it('is true when the pressed tab is already focused', () => {
    expect(isTabRepress({ routes: [{ key: 'home-1' }, { key: 'ajo-1' }], index: 1 }, 'ajo-1')).toBe(
      true,
    );
  });

  it('is false when switching from another tab', () => {
    expect(isTabRepress({ routes: [{ key: 'home-1' }, { key: 'ajo-1' }], index: 0 }, 'ajo-1')).toBe(
      false,
    );
  });

  it('is false without navigator state', () => {
    expect(isTabRepress(undefined, 'ajo-1')).toBe(false);
  });
});

describe('createTabRootListener', () => {
  it('unwinds to the tab root on a re-press from a deep screen', () => {
    const listeners = createTabRootListener('/(tabs)/ajo')({
      navigation: { getState: () => ({ routes: [{ key: 'ajo-1' }], index: 0 }) },
      route: { key: 'ajo-1' },
    });
    const preventDefault = jest.fn();

    listeners.tabPress({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(dismissTo).toHaveBeenCalledWith('/(tabs)/ajo');
  });

  it('lets the default action switch tabs on first press', () => {
    const listeners = createTabRootListener('/(tabs)/ajo')({
      navigation: { getState: () => ({ routes: [{ key: 'home-1' }, { key: 'ajo-1' }], index: 0 }) },
      route: { key: 'ajo-1' },
    });
    const preventDefault = jest.fn();

    listeners.tabPress({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(dismissTo).not.toHaveBeenCalled();
  });
});
