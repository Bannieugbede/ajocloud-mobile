import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * The header the tab screens draw for themselves.
 *
 * Each tab names itself in the first line of its own content — "My Ajo
 * Groups", "Akawo", "Food Ajo" — so a navigator title bar above that would
 * print the name twice and cost a fixed strip of height on a small phone. The
 * header scrolls away with the content instead.
 *
 * Round icon buttons and inline actions are both supported because the designs
 * use both: Profile carries a settings gear, Ajo and Akawo carry Join and
 * Create. Anything more elaborate belongs in `children`.
 */

export type HeaderAction = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Accessible name. Required: an icon alone announces nothing. */
  label: string;
  onPress: () => void;
  /** Draws an unread mark. The count belongs in `label`, not only here. */
  badge?: boolean;
};

export function AppScreenHeader({
  title,
  subtitle,
  eyebrow,
  actions = [],
  children,
}: {
  title: string;
  /** The line beneath the title, e.g. "4 active groups". */
  subtitle?: string;
  /** A line above the title, for a greeting. */
  eyebrow?: string;
  actions?: readonly HeaderAction[];
  /** Buttons that sit beside the title, for Join and Create. */
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        {eyebrow ? (
          <AppText style={[styles.subtitle, { color: colors.textMuted }]}>{eyebrow}</AppText>
        ) : null}
        <AppText accessibilityRole="header" weight="bold" style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {children ? <View style={styles.inlineActions}>{children}</View> : null}

      {actions.length ? (
        <View style={styles.iconActions}>
          {actions.map((action) => (
            <HeaderIconButton key={action.label} action={action} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function HeaderIconButton({ action }: { action: HeaderAction }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      // Restores the 48dp touch target the smaller button gives up.
      hitSlop={5}
      style={({ pressed }) => [
        styles.roundButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={action.icon} size={18} color={colors.text} />
      {action.badge ? (
        // Decorative: whatever the dot signifies is already in the button's
        // accessible name, so announcing it again would repeat it.
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.badgeDot, { backgroundColor: colors.error, borderColor: colors.surface }]}
        />
      ) : null}
    </Pressable>
  );
}

/**
 * The title sits between body and title size.
 *
 * A full `fontSizes.title` next to the Join and Create pair left the row
 * looking top-heavy and pushed the buttons into the title's line. This reads as
 * a heading without dominating the actions beside it, and still scales with the
 * user's font setting.
 */
const TITLE_SIZE = 18;

/** Trimmed from 44 so a pair of them does not outweigh the title. */
const ICON_BUTTON_SIZE = 38;

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  titles: { flex: 1, gap: 1 },
  title: { fontSize: TITLE_SIZE },
  subtitle: { fontSize: fontSizes.caption },
  inlineActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  iconActions: { flexDirection: 'row', gap: spacing.sm },
  roundButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: ICON_BUTTON_SIZE,
    justifyContent: 'center',
    width: ICON_BUTTON_SIZE,
  },
  badgeDot: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 9,
    position: 'absolute',
    right: 7,
    top: 7,
    width: 9,
  },
});
