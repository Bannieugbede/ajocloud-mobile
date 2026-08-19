import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

export const PIN_LENGTH = 4;

/**
 * Fixed-length PIN entry. A single hidden TextInput backs a row of boxes: that
 * keeps native keyboard, paste and autofill behaviour while letting the boxes
 * be styled. Entered digits are masked and never rendered as text.
 */
export function PinInput({
  label,
  value,
  onChange,
  error,
  editable = true,
  autoFocus = false,
  testID,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  editable?: boolean;
  autoFocus?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const errorId = error ? `${testID ?? label}-error` : undefined;

  return (
    <View style={styles.group}>
      <AppText weight="semibold" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        // The boxes are decorative; this row forwards taps to the real input.
        accessibilityRole="none"
        accessible={false}
        onPress={() => input.current?.focus()}
        style={styles.boxes}
      >
        {Array.from({ length: PIN_LENGTH }, (_, index) => {
          const filled = index < value.length;
          const active = focused && index === value.length;
          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: error ? colors.error : active ? colors.primary : colors.inputBorder,
                  borderWidth: active ? 2 : 1,
                },
              ]}
            >
              {filled ? <View style={[styles.dot, { backgroundColor: colors.text }]} /> : null}
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        accessibilityLabel={label}
        accessibilityHint={error}
        aria-describedby={errorId}
        autoFocus={autoFocus}
        caretHidden
        editable={editable}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        onBlur={() => setFocused(false)}
        onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, PIN_LENGTH))}
        onFocus={() => setFocused(true)}
        secureTextEntry
        // Kept in the layout (not display:none) so focus and the keyboard work,
        // but visually collapsed behind the boxes that represent it.
        style={styles.hidden}
        testID={testID}
        textContentType="oneTimeCode"
        value={value}
      />
      {error ? (
        <AppText
          nativeID={errorId}
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.error }]}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: fontSizes.caption },
  boxes: { flexDirection: 'row', gap: spacing.sm },
  box: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 72,
    minHeight: sizes.touchTarget + 8,
  },
  dot: { borderRadius: radius.pill, height: 12, width: 12 },
  hidden: { height: 1, opacity: 0, position: 'absolute', width: 1 },
  error: { fontSize: fontSizes.caption },
});
