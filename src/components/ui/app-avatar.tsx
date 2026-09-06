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
  shape = 'circle',
  tone = 'soft',
  style,
  testID,
}: {
  name: string;
  size?: number;
  /**
   * `rounded` is the profile header's square mark. Everywhere a member appears
   * in a list they stay circular, so the shape distinguishes "this is you" from
   * "this is someone in the group".
   */
  shape?: 'circle' | 'rounded';
  /** `solid` fills with the brand colour and reverses the initials. */
  tone?: 'soft' | 'solid';
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

  const solid = tone === 'solid';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.avatar,
        {
          backgroundColor: solid ? colors.primary : colors.primarySoft,
          // A rounded square keeps its corner radius proportional, so it reads
          // the same at every size rather than turning into a circle when small.
          borderRadius: shape === 'circle' ? size / 2 : Math.round(size * 0.28),
          height: size,
          width: size,
        },
        style,
      ]}
      testID={testID}
    >
      <AppText
        weight="bold"
        style={{
          color: solid ? colors.textInverse : colors.primary,
          fontSize: size < 36 ? fontSizes.caption : size >= 64 ? fontSizes.title : fontSizes.body,
        }}
      >
        {initials || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
