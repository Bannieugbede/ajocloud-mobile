import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

import { AppText } from './app-text';

export type SheetAction = {
  label: string;
  /** One line saying what the action does, when the label alone is ambiguous. */
  description?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

/**
 * A short list of actions, raised from the bottom of the screen.
 *
 * `AppSelect` already models a full-page sheet, which is right for a long list
 * someone scrolls and searches. This is the other shape: two or three things to
 * do, where taking over the whole screen would overstate the choice. The panel
 * sits at the bottom because that is where a thumb already is, having just
 * pressed the control that opened it.
 *
 * `transparent` rather than `presentationStyle`, so the content behind stays
 * visible through the scrim and the sheet reads as a layer over this screen
 * rather than a new one. Dismissal is offered three ways — the scrim, the
 * handle's Close button, and Android's back gesture via `onRequestClose` —
 * because a sheet that can only be dismissed by choosing something is a trap.
 */
export function AppActionSheet({
  visible,
  title,
  actions,
  onClose,
  testID,
}: {
  visible: boolean;
  /** Announced as the sheet's heading, naming what the actions belong to. */
  title: string;
  actions: readonly SheetAction[];
  onClose: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
      testID={testID}
    >
      {/* The scrim is a button in its own right: tapping outside a sheet to
          dismiss it is the gesture people already have. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${title.toLowerCase()}`}
        onPress={onClose}
        style={[styles.scrim, { backgroundColor: colors.scrim }]}
      />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />

        <View style={styles.header}>
          <AppText accessibilityRole="header" weight="bold" style={styles.title}>
            {title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={spacing.sm}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={
              action.description ? `${action.label}. ${action.description}` : action.label
            }
            onPress={() => {
              // Closed before the action runs, so a handler that navigates does
              // not leave a sheet mounted over the screen it moved to.
              onClose();
              action.onPress();
            }}
            style={({ pressed }) => [
              styles.action,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={action.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.actionText}>
              <AppText weight="semibold">{action.label}</AppText>
              {action.description ? (
                <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
                  {action.description}
                </AppText>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1 },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.xs,
    width: 40,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontSize: fontSizes.title - 2 },
  action: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget + 12,
    padding: spacing.md,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  actionText: { flex: 1, gap: 2 },
});
