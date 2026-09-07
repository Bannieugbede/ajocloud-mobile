import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A photographic header with the title laid over it.
 *
 * Distinct from `AppHero`, which is a brand-coloured panel for a figure. This
 * is for a thing with a picture — a food package, a programme — where the photo
 * is most of what tells someone what they are looking at.
 *
 * A gradient sits between the image and the text rather than a flat overlay: a
 * photograph can be light or dark anywhere, and only a scrim behind the text
 * keeps it legible on both without dimming the whole picture.
 */

/** Falls back to a tinted block when a package has no photograph. */
const IMAGE_HEIGHT = 260;

export function AppImageHero({
  imageUrl,
  title,
  subtitle,
  badge,
  trailing,
  testID,
}: {
  imageUrl?: string | null;
  title: string;
  /** A line under the title, e.g. who runs it. */
  subtitle?: React.ReactNode;
  /** A pill in the top corner, e.g. "Joined". */
  badge?: React.ReactNode;
  /** A control in the top-left, typically a back button. */
  trailing?: React.ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.hero, { backgroundColor: colors.surfaceMuted }]} testID={testID}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          // Decorative: the title beneath names the thing, so describing the
          // photograph would only repeat it.
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}

      <LinearGradient
        colors={['rgba(7,17,31,0.15)', 'rgba(7,17,31,0.86)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {badge ? <View style={styles.badge}>{badge}</View> : null}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

      <View style={styles.text}>
        <AppText accessibilityRole="header" weight="bold" style={styles.title} numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? <View style={styles.subtitle}>{subtitle}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    height: IMAGE_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  badge: { position: 'absolute', right: spacing.md, top: spacing.md },
  trailing: { left: spacing.md, position: 'absolute', top: spacing.md },
  text: { gap: spacing.xs, padding: spacing.md },
  title: { color: '#FFFFFF', fontSize: fontSizes.heading },
  subtitle: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
});
