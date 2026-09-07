import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useNavigation } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { sizes, spacing } from '@/theme';

/**
 * A back control that floats over a full-bleed header.
 *
 * For screens whose own artwork runs under the status bar, where a navigator
 * header would draw the title twice. It sits on its own scrim so it stays
 * visible over a photograph of any brightness, and it clears the notch itself
 * because the screen behind it deliberately does not.
 *
 * Prefers real history and falls back to a declared screen, for the same reason
 * `AppHeaderBack` does: a screen reached by switching tabs has no history, and
 * would otherwise strand the member.
 */
export function AppFloatBack({ fallback }: { fallback?: Href }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={spacing.sm}
      onPress={() => {
        if (navigation.canGoBack()) router.back();
        else if (fallback) router.replace(fallback);
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.scrim, marginTop: insets.top, opacity: pressed ? 0.7 : 1 },
      ]}
      testID="float-back-button"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: sizes.touchTarget / 2,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
});
