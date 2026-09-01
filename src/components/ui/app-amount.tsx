import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { AppText } from './app-text';

type AmountSize = 'caption' | 'body' | 'title' | 'heading';

/**
 * Renders a minor-unit balance. When `hidden` is set the digits are masked but
 * the accessible name still says the balance is hidden rather than reading the
 * dot characters aloud, and `onInverse` keeps the value legible on the brand
 * blue wallet surfaces where the normal text token would fail contrast.
 */
export function AppAmount({
  amountMinor,
  currency = 'NGN',
  size = 'body',
  hidden = false,
  onInverse = false,
  style,
  testID,
}: {
  amountMinor: string;
  currency?: string;
  size?: AmountSize;
  hidden?: boolean;
  onInverse?: boolean;
  style?: StyleProp<TextStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const formatted = formatMinorAmount(amountMinor, currency);
  return (
    <AppText
      weight={size === 'caption' ? 'medium' : 'bold'}
      accessibilityLabel={hidden ? 'Balance hidden' : formatted}
      style={[styles[size], { color: onInverse ? colors.textInverse : colors.text }, style]}
      testID={testID}
    >
      {hidden ? '••••••' : formatted}
    </AppText>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: fontSizes.caption },
  body: { fontSize: fontSizes.body },
  title: { fontSize: fontSizes.title },
  heading: { fontSize: fontSizes.heading },
});
