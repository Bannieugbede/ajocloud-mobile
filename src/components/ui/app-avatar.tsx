import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes } from '@/theme';

import { AppText } from './app-text';

/**
 * Initials-only avatar. Ajo Cloud deliberately does not render member photos —
 * Akawo participation lists identify people by name and reference, not image —
 * so this stays a text mark and never fetches a remote URL.
 */
export function AppAvatar({
  name,
  size = 40,
  style,
  testID,
}: {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.avatar,
        { backgroundColor: colors.primarySoft, borderRadius: size / 2, height: size, width: size },
        style,
      ]}
      testID={testID}
    >
      <AppText
        weight="semibold"
        style={{ color: colors.primary, fontSize: size < 36 ? fontSizes.caption : fontSizes.body }}
      >
        {initials || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
