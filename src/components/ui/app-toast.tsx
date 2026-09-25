import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * Toasts: how the app tells a member that something failed, needs attention,
 * or worked.
 *
 * Expo ships no toast, and the libraries that do bring their own native
 * modules for something this small. This is a store any code can write to —
 * a screen, a mutation callback, the query cache — and one host at the root
 * that draws it, so a message is never tied to whichever screen happened to
 * cause it.
 *
 * Errors and warnings a member has to act on at once, such as confirming a
 * payment, still belong in a dialog. A toast is for news, not for decisions.
 */

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastAction = { label: string; onPress: () => void };

export type ToastOptions = {
  /** A short heading above the message, such as "Couldn't load". */
  title?: string;
  /** Milliseconds on screen. `Infinity` keeps it until dismissed or replaced. */
  duration?: number;
  /** One button, such as "Try again". Tapping it also dismisses the toast. */
  action?: ToastAction;
  /**
   * A stable key. Showing a toast with the id of one on screen replaces it,
   * which is how "You're offline" becomes "Back online" rather than stacking.
   */
  id?: string;
};

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
  title?: string;
  duration: number;
  action?: ToastAction;
  /** Bumped when the same toast is shown again, to restart its timer. */
  version: number;
};

/** Long enough to read, and longer for what needs reading or acting on. */
const DURATIONS: Record<ToastTone, number> = {
  success: 3_500,
  info: 4_000,
  warning: 5_000,
  error: 6_000,
};
const DURATION_WITH_ACTION = 8_000;

/**
 * Whether the member has asked the system for less motion. Read once and
 * kept current, so a toast can appear and leave without sliding when it is.
 */
let reduceMotion = false;
void AccessibilityInfo.isReduceMotionEnabled()
  .then((enabled) => {
    reduceMotion = enabled;
  })
  .catch(() => undefined);
AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
  reduceMotion = enabled;
});

/** More than three at once is a wall, not a notification. */
export const MAX_VISIBLE_TOASTS = 3;

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let counter = 0;

function publish(next: Toast[]) {
  toasts = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getToasts() {
  return toasts;
}

const HAPTICS: Record<ToastTone, Haptics.NotificationFeedbackType | null> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
  info: null,
};

function announce(entry: Toast) {
  // A screen reader user cannot see a toast arrive, so it is spoken.
  AccessibilityInfo.announceForAccessibility(
    entry.title ? `${entry.title}. ${entry.message}` : entry.message,
  );
  const feedback = HAPTICS[entry.tone];
  if (feedback) void Haptics.notificationAsync(feedback).catch(() => undefined);
}

function show(tone: ToastTone, message: string, options: ToastOptions = {}): string {
  const duration = options.duration ?? (options.action ? DURATION_WITH_ACTION : DURATIONS[tone]);

  // The same news twice, such as three screens failing on one lost connection,
  // is one toast whose timer restarts rather than a stack of copies.
  const existing = toasts.find((entry) =>
    options.id ? entry.id === options.id : entry.tone === tone && entry.message === message,
  );
  if (existing) {
    const updated: Toast = {
      ...existing,
      tone,
      message,
      duration,
      version: existing.version + 1,
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.action !== undefined ? { action: options.action } : {}),
    };
    publish(toasts.map((entry) => (entry.id === existing.id ? updated : entry)));
    if (existing.tone !== tone || existing.message !== message) announce(updated);
    return existing.id;
  }

  counter += 1;
  const entry: Toast = {
    id: options.id ?? `toast-${counter}`,
    tone,
    message,
    duration,
    version: 0,
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.action !== undefined ? { action: options.action } : {}),
  };
  // Newest first; the oldest beyond the limit makes way.
  publish([entry, ...toasts].slice(0, MAX_VISIBLE_TOASTS));
  announce(entry);
  return entry.id;
}

export const toast = {
  show,
  success: (message: string, options?: ToastOptions) => show('success', message, options),
  error: (message: string, options?: ToastOptions) => show('error', message, options),
  warning: (message: string, options?: ToastOptions) => show('warning', message, options),
  info: (message: string, options?: ToastOptions) => show('info', message, options),
  dismiss: (id: string) => publish(toasts.filter((entry) => entry.id !== id)),
  /** Removes every toast. For tests, and for signing out. */
  clear: () => publish([]),
};

/** The toasts on screen right now, newest first, outside React. For tests. */
export function currentToasts(): readonly Toast[] {
  return toasts;
}

/** The toasts on screen, newest first. */
export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getToasts, getToasts);
}

const ICONS: Record<ToastTone, React.ComponentProps<typeof Ionicons>['name']> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

/**
 * Draws the toasts. Mounted once, above every screen, at the root layout.
 * Everything outside the cards passes touches through to the screen beneath.
 */
export function AppToastHost() {
  const entries = useToasts();
  const insets = useSafeAreaInsets();
  if (entries.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + spacing.sm }]}
      testID="toast-host"
    >
      {entries.map((entry) => (
        <ToastCard key={entry.id} entry={entry} />
      ))}
    </View>
  );
}

function ToastCard({ entry }: { entry: Toast }) {
  const { colors } = useTheme();
  // Created once per card. Lazy state rather than refs, which the React
  // Compiler forbids reading during render; the id never changes for a card.
  const [motion] = useState(() => createMotion(entry.id));
  const { appear, drag, swipe, dismiss } = motion;

  const tint = {
    success: { accent: colors.success, soft: colors.successSoft },
    error: { accent: colors.error, soft: colors.errorSoft },
    warning: { accent: colors.warning, soft: colors.warningSoft },
    info: { accent: colors.info, soft: colors.infoSoft },
  }[entry.tone];

  useEffect(() => {
    if (reduceMotion) {
      appear.setValue(1);
      return;
    }
    Animated.spring(appear, { toValue: 1, useNativeDriver: true, bounciness: 4 }).start();
  }, [appear]);

  // Restarts whenever the same toast is shown again.
  useEffect(() => {
    if (!Number.isFinite(entry.duration)) return;
    const timer = setTimeout(dismiss, entry.duration);
    return () => clearTimeout(timer);
  }, [entry.duration, entry.version, dismiss]);

  return (
    <Animated.View
      {...swipe.panHandlers}
      accessibilityLiveRegion={entry.tone === 'error' ? 'assertive' : 'polite'}
      testID={`toast-${entry.tone}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          opacity: appear,
          transform: [
            { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
            { translateX: drag.x },
            { translateY: drag.y },
          ],
        },
      ]}
    >
      {/* The role sits on the message rather than the card, so the action
          beside it stays a separate control a screen reader can reach. */}
      <Pressable
        onPress={dismiss}
        accessibilityRole="alert"
        accessibilityHint="Dismisses this message"
        style={styles.body}
      >
        <View style={[styles.icon, { backgroundColor: tint.soft }]}>
          <Ionicons
            name={ICONS[entry.tone]}
            size={20}
            color={tint.accent}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.copy}>
          {entry.title ? (
            <AppText weight="semibold" style={styles.title}>
              {entry.title}
            </AppText>
          ) : null}
          <AppText
            style={[styles.message, { color: entry.title ? colors.textMuted : colors.text }]}
          >
            {entry.message}
          </AppText>
        </View>
      </Pressable>
      {entry.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            entry.action?.onPress();
            dismiss();
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed ? { opacity: 0.6 } : null]}
        >
          <AppText weight="semibold" style={{ color: colors.primary }}>
            {entry.action.label}
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

/**
 * A card's animation: its entrance, the drag that dismisses it, and the exit.
 * A swipe sideways or upwards past a short distance dismisses; anything less
 * springs back, so a tap still reaches the action button.
 */
function createMotion(id: string) {
  const appear = new Animated.Value(0);
  const drag = new Animated.ValueXY();
  let leaving = false;

  const dismiss = () => {
    if (leaving) return;
    leaving = true;
    if (reduceMotion) {
      toast.dismiss(id);
      return;
    }
    Animated.timing(appear, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
      toast.dismiss(id),
    );
  };

  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 8 || gesture.dy < -8,
    onPanResponderMove: (_event, gesture) =>
      drag.setValue({ x: gesture.dx, y: Math.min(0, gesture.dy) }),
    onPanResponderRelease: (_event, gesture) => {
      if (Math.abs(gesture.dx) > 80 || gesture.dy < -40) {
        dismiss();
        return;
      }
      Animated.spring(drag, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
  });

  return { appear, drag, swipe, dismiss };
}

const styles = StyleSheet.create({
  host: {
    gap: spacing.sm,
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingRight: spacing.sm,
    // A soft lift, so the card reads as above the screen rather than on it.
    shadowColor: '#07111F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  body: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm + 4,
    padding: spacing.sm + 4,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: fontSizes.body - 1 },
  message: { fontSize: fontSizes.body - 2, lineHeight: 20 },
  action: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
});
