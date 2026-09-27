import { HeaderHeightContext } from 'expo-router/react-navigation';
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type KeyboardEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { spacing } from '@/theme';

/**
 * Keeping inputs clear of the keyboard, once, for every screen and sheet.
 *
 * Every form used to wrap itself in `KeyboardAvoidingView` with
 * `behavior={ios ? 'padding' : undefined}` and no offset, which failed twice:
 *
 * - On iOS the view measures itself from the top of the window, but under a
 *   native header it starts below it, so it lifted the content short by the
 *   header's height and the last field sat behind the keyboard.
 * - On Android `undefined` relied on the window resizing, which the app's
 *   edge-to-edge layout switches off, so nothing moved at all.
 *
 * Here both platforms pad, iOS offsets by the header it is actually under,
 * and a scrolling form brings the focused field into view as the keyboard
 * opens. Plain JavaScript on purpose: no native module, so no rebuild.
 */

/** Space kept between the focused field and the top of the keyboard. */
const FIELD_MARGIN = spacing.lg;

/**
 * The height of the native header this screen sits under, or 0 in a modal or
 * a screen without one. Read from context rather than `useHeaderHeight`, which
 * throws outside a navigator.
 */
function useHeaderOffset(): number {
  return useContext(HeaderHeightContext) ?? 0;
}

/**
 * How far above the window's origin the lifted content starts. Android
 * measures from the same origin the keyboard reports, so only iOS needs the
 * header it sits under added back.
 */
export function keyboardOffset({
  platform,
  headerHeight,
  offset = 0,
  ignoreHeader = false,
}: {
  platform: string;
  headerHeight: number;
  offset?: number;
  ignoreHeader?: boolean;
}): number {
  if (platform !== 'ios') return 0;
  return (ignoreHeader ? 0 : headerHeight) + offset;
}

/**
 * Lifts its children above the keyboard. Use it around anything that is not a
 * plain scrolling form, such as a list with a search box or a sheet.
 *
 * `offset` adds to the header height, for content that starts lower still.
 */
export function AppKeyboardAvoidingView({
  children,
  style,
  offset = 0,
  ignoreHeader = false,
  enabled = true,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  offset?: number;
  /** For content outside the navigator, such as a modal sheet. */
  ignoreHeader?: boolean;
  /** Off where the platform already makes room, e.g. an iOS page sheet's list. */
  enabled?: boolean;
}>) {
  const header = useHeaderOffset();
  return (
    <KeyboardAvoidingView
      enabled={enabled}
      behavior="padding"
      keyboardVerticalOffset={keyboardOffset({
        platform: Platform.OS,
        headerHeight: header,
        offset,
        ignoreHeader,
      })}
      style={[styles.flex, style]}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export type AppKeyboardScrollViewHandle = { scrollToFocused: () => void };

/**
 * A scrolling form that keeps the field being typed in visible.
 *
 * `footer` is drawn below the scrolling content and rises with the keyboard,
 * for a primary action that should stay reachable while typing. Everything
 * else is a normal `ScrollView`, with taps on buttons working while the
 * keyboard is up and a drag dismissing it.
 */
export const AppKeyboardScrollView = forwardRef<
  AppKeyboardScrollViewHandle,
  ScrollViewProps & {
    children: ReactNode;
    footer?: ReactNode;
    /** Style for the outer, full-height view: usually the background colour. */
    style?: StyleProp<ViewStyle>;
    ignoreHeader?: boolean;
  }
>(function AppKeyboardScrollView(
  { children, footer, style, ignoreHeader = false, onScroll, ...scrollProps },
  ref,
) {
  const scroll = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const keyboardTop = useRef<number | null>(null);

  const scrollToFocused = () => {
    const input = TextInput.State.currentlyFocusedInput();
    const top = keyboardTop.current;
    if (!input || top === null || !scroll.current) return;
    input.measureInWindow((_x, y, _width, height) => {
      const hidden = y + height + FIELD_MARGIN - top;
      if (hidden > 0) {
        scroll.current?.scrollTo({ y: offsetY.current + hidden, animated: true });
      }
    });
  };

  useImperativeHandle(ref, () => ({ scrollToFocused }));

  useEffect(() => {
    // iOS announces the keyboard again whenever focus moves to another field,
    // so each newly focused field is brought into view too. On Android the
    // scroll view keeps its focused child visible natively; this covers the
    // first appearance, once the padding has shrunk the view.
    const show = Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY || Dimensions.get('window').height;
      requestAnimationFrame(scrollToFocused);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
    // scrollToFocused reads only refs, so it is safe to capture once.
  }, []);

  return (
    <AppKeyboardAvoidingView style={style} ignoreHeader={ignoreHeader}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
        {...scrollProps}
        onScroll={(event) => {
          offsetY.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
      >
        {children}
      </ScrollView>
      {/* Drawn as given: a footer usually has its own surface and border. */}
      {footer}
    </AppKeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
