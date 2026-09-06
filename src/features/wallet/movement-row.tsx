import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { WalletTransaction } from '@/api/endpoints/wallets';
import { AppBadge } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  categoryIcon,
  categoryOf,
  isMoneyIn,
  movementTimeLabel,
  signedAmountLabel,
  type MovementCategory,
} from './transaction-history';

/** The tint behind a movement's glyph, so products are distinguishable at a glance. */
function categoryTint(
  category: MovementCategory,
  colors: ReturnType<typeof useTheme>['colors'],
): { background: string; foreground: string } {
  switch (category) {
    case 'wallet':
    case 'transfer':
      return { background: colors.primarySoft, foreground: colors.primary };
    case 'ajo':
    case 'akawo':
      return { background: colors.successSoft, foreground: colors.success };
    case 'food':
    case 'bill':
      return { background: colors.warningSoft, foreground: colors.warning };
    default:
      return { background: colors.surfaceMuted, foreground: colors.textMuted };
  }
}

export function MovementRow({
  movement,
  currency,
  boxed = false,
}: {
  movement: WalletTransaction;
  currency: string;
  /**
   * Draws the row on its own card, as the history list does. Inside a card that
   * already has a surface — the wallet's recent activity — it stays flat, since
   * a card within a card reads as clutter.
   */
  boxed?: boolean;
}) {
  const { colors } = useTheme();
  const category = categoryOf(movement);
  const tint = categoryTint(category, colors);
  const moneyIn = isMoneyIn(movement);
  const formatted = formatMinorAmount(movement.amountMinor, currency);
  const signed = signedAmountLabel(movement, formatted);
  const when = movementTimeLabel(movement);
  const status = statusLabel(movement.transaction.status);
  const settled = movement.transaction.status.toUpperCase() === 'SUCCESSFUL';

  // One element rather than five: read as fragments, an amount can be matched
  // to the wrong row, which on a money screen is the worst failure.
  const row = (
    <View
      accessible
      accessibilityLabel={`${movement.transaction.description}, ${signed}, ${status}, ${when}`}
      style={styles.rowInner}
    >
      <View style={[styles.glyph, { backgroundColor: tint.background }]}>
        <Ionicons
          name={categoryIcon(category) as React.ComponentProps<typeof Ionicons>['name']}
          size={20}
          color={tint.foreground}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>

      <View style={styles.rowText}>
        <AppText weight="semibold" numberOfLines={1}>
          {movement.transaction.description}
        </AppText>
        <AppText style={[styles.meta, { color: colors.textMuted }]}>{when}</AppText>
      </View>

      <View style={styles.rowTrailing}>
        <AppText
          weight="bold"
          numberOfLines={1}
          style={{ color: moneyIn ? colors.success : colors.text }}
        >
          {signed}
        </AppText>
        {/* A failed or pending movement is called out; a settled one is the
              norm and says so quietly rather than shouting a green pill. */}
        {settled ? (
          <AppText style={[styles.meta, { color: colors.success }]}>{status}</AppText>
        ) : (
          <AppBadge
            label={status}
            tone={movement.transaction.status.toUpperCase() === 'FAILED' ? 'error' : 'warning'}
          />
        )}
      </View>
    </View>
  );

  return boxed ? <AppCard style={styles.row}>{row}</AppCard> : row;
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.sm },
  rowInner: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  glyph: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowText: { flex: 1, gap: 2 },
  rowTrailing: { alignItems: 'flex-end', gap: 2 },
  meta: { fontSize: fontSizes.caption },
});
