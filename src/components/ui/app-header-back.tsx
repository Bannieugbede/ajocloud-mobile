import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useNavigation, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { sizes, spacing } from '@/theme';

/**
 * A back control that works when there is no stack history to go back to.
 *
 * Expo Router only draws a native back button when the screen was pushed onto
 * the stack it belongs to. Two things defeat that here:
 *
 * Navigating between tabs — Home to Bills, Profile to identity verification, a
 * pool to the shared payment flow — switches navigator rather than pushing, so
 * the destination has no history and renders no back button. The member is left
 * on a screen with no way out but the tab bar, which does not return them to
 * where they came from.
 *
 * And a screen reached by `replace`, which is how every post-submit screen is
 * opened, deliberately leaves nothing behind.
 *
 * Real history is preferred when there is any, so the ordinary case still
 * behaves like the platform's own back. `fallback` is where to go when there
 * is none — the screen that logically contains this one, not the one the member
 * happened to arrive from.
 */
export function AppHeaderBack({ fallback }: { fallback: Href }) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={spacing.sm}
      onPress={() => {
        if (navigation.canGoBack()) router.back();
        else router.replace(fallback);
      }}
      style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
      testID="header-back-button"
    >
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}

/**
 * Screen options that guarantee a back control.
 *
 * Replaces the native one rather than sitting beside it, so a screen cannot end
 * up with two chevrons when it does happen to have history.
 */
export function backTo(fallback: Href) {
  return {
    headerLeft: () => <AppHeaderBack fallback={fallback} />,
    headerBackVisible: false,
  };
}

const styles = StyleSheet.create({
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
  },
});
