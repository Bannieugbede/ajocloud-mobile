import { router } from 'expo-router';

type TabState =
  | {
      routes: { key: string }[];
      index: number;
    }
  | undefined;

type TabPressEvent = {
  preventDefault: () => void;
};

type ListenerProps = {
  navigation: {
    getState: () => TabState;
  };
  route: { key: string };
};

/**
 * A re-press is the second tap on an already-focused tab: the first tap
 * selected the tab, the second arrives while its route is still focused.
 * Returning true means the nested stack should unwind to its root.
 */
export function isTabRepress(state: TabState, routeKey: string): boolean {
  if (!state) return false;
  return state.routes[state.index]?.key === routeKey;
}

/**
 * Builds a `Tabs.Screen` listeners prop that pops a deep nested stack back
 * to its tab root when the focused tab's icon is pressed again.
 *
 * Without this, a member deep inside e.g. Ajo group detail stays there when
 * they tap the Ajo icon — the tab is already focused so the default action
 * does nothing. With it, the second tap unwinds via `dismissTo`, which pops
 * stacked screens rather than pushing a second copy of the root.
 */
export function createTabRootListener(root: string) {
  return ({ navigation, route }: ListenerProps) => ({
    tabPress: (e: TabPressEvent) => {
      if (!isTabRepress(navigation.getState(), route.key)) return;
      e.preventDefault();
      router.dismissTo(root as never);
    },
  });
}
