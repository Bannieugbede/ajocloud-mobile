import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';

const MARK = require('../../assets/images/splash-icon.png');

/**
 * Brand mark plus wordmark, used as the auth stack's header title. The whole
 * group is one accessibility element so screen readers announce the product
 * name rather than an unlabelled image next to loose text.
 */
export function Logo({ size = 24 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="Ajo Cloud" style={styles.row}>
      <Image source={MARK} contentFit="contain" style={{ height: size, width: size }} />
      <AppText weight="bold" style={[styles.word, { color: colors.text }]}>
        Ajo
        <AppText weight="bold" style={{ color: colors.secondary }}>
          {' '}
          Cloud
        </AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  word: { fontSize: fontSizes.body },
});
