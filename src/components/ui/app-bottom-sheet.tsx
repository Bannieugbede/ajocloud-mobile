import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppKeyboardAvoidingView } from './app-keyboard';
import { AppText } from './app-text';

/**
 * A panel raised from the bottom of the screen over a dimmed backdrop: the
 * one sheet every bottom sheet in the app is built on.
 *
 * `transparent` rather than `presentationStyle`, so the content behind stays
 * visible through the scrim and the sheet reads as a layer over this screen
 * rather than a new one. Dismissal is offered three ways — the scrim, the
 * Close button, and Android's back gesture via `onRequestClose` — because a
 * sheet that can only be dismissed by choosing something is a trap.
 *
 * The panel rises with the keyboard, so a field in a sheet stays in view, and
 * its content scrolls once it would outgrow the screen.
 */
export function AppBottomSheet({
  visible,
  title,
  onClose,
  children,
  testID,
}: {
  visible: boolean;
  /** Announced as the sheet's heading. */
  title: string;
  onClose: () => void;
  children: ReactNode;
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
      // Lets the panel draw under the status and navigation bars on Android, so
      // the keyboard is measured against the same window as the sheet.
      {...(Platform.OS === 'android'
        ? { statusBarTranslucent: true, navigationBarTranslucent: true }
        : {})}
    >
      {/* A modal sits outside the navigator's header, so no header offset. */}
      <AppKeyboardAvoidingView ignoreHeader style={styles.frame}>
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

          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </AppKeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frame: { justifyContent: 'flex-end' },
  scrim: StyleSheet.absoluteFill,
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
    // Room above for the scrim, so there is always somewhere to tap to close.
    maxHeight: '90%',
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
  content: { gap: spacing.sm },
});
