import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, minorToMajor } from '@/utils/money';
import { AppInput } from '@/components/ui/app-input';

import {
  MINIMUM_TOPUP_MINOR,
  QUICK_AMOUNTS_MINOR,
  topupAmountMinor,
  topupProblem,
  topupProblemMessage,
} from './fund-wallet';

/**
 * Bringing money into the wallet.
 *
 * The only payment in the app where the payer names the amount, because a
 * top-up has no row to read one from. The balance is shown first so the figure
 * being added is chosen against what is already there rather than in the
 * abstract.
 */
export function FundWalletScreen({
  availableMinor,
  currency,
  submitting,
  error,
  onContinue,
}: {
  /** Null while the balance is unknown; the screen still works without it. */
  availableMinor: string | null;
  currency: string;
  submitting: boolean;
  error?: AppError | null;
  onContinue: (amountMinor: string) => void;
}) {
  const { colors } = useTheme();
  const [amountMajor, setAmountMajor] = useState('');
  const [touched, setTouched] = useState(false);

  const problem = topupProblem(amountMajor);
  const amountMinor = topupAmountMinor(amountMajor);
  const minimum = formatMinorAmount(MINIMUM_TOPUP_MINOR.toString(), currency);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible
          accessibilityLabel={
            availableMinor === null
              ? 'Current balance unavailable'
              : `Current balance ${formatMinorAmount(availableMinor, currency)}`
          }
          style={[styles.balance, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText weight="semibold" style={[styles.balanceLabel, { color: colors.textMuted }]}>
            CURRENT BALANCE
          </AppText>
          {availableMinor === null ? (
            // Said rather than shown as zero: a balance that failed to load and
            // a balance of nothing are different, and confusing them is how
            // someone concludes their money has gone.
            <AppText weight="bold" style={styles.balanceUnavailable}>
              Unavailable
            </AppText>
          ) : (
            <AppAmount amountMinor={availableMinor} currency={currency} size="heading" />
          )}
        </View>

        <SectionLabel>QUICK SELECT</SectionLabel>
        <View style={styles.grid}>
          {QUICK_AMOUNTS_MINOR.map((minor) => {
            const label = formatMinorAmount(minor, currency);
            const selected = amountMinor === minor;
            return (
              <Pressable
                key={minor}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Add ${label}`}
                onPress={() => {
                  setAmountMajor(minorToMajor(minor));
                  setTouched(false);
                }}
                style={({ pressed }) => [
                  styles.quick,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText
                  weight="semibold"
                  style={{ color: selected ? colors.textInverse : colors.text }}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppInput
          label="Or enter amount (₦)"
          value={amountMajor}
          onChangeText={(value) => {
            setAmountMajor(value);
            setTouched(false);
          }}
          placeholder="0"
          keyboardType="decimal-pad"
          error={
            touched && problem ? (topupProblemMessage(problem, minimum) ?? undefined) : undefined
          }
        />

        <AppText style={[styles.hint, { color: colors.textMuted }]}>
          {/* Stated up front: a deposit carries a fee (ADR-009) and finding
              that out on the confirmation screen feels like a surprise charge. */}
          The smallest amount you can add is {minimum}. A deposit fee applies and is shown before
          you pay.
        </AppText>

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Continue"
          onPress={() => {
            if (!amountMinor) {
              setTouched(true);
              return;
            }
            onContinue(amountMinor);
          }}
          loading={submitting}
          // Disabled rather than erroring on an untouched field: nothing is
          // wrong yet, the amount simply has not been chosen.
          disabled={submitting || !amountMinor}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText weight="semibold" style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

  balance: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  balanceLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },
  balanceUnavailable: { fontSize: fontSizes.title },

  sectionLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    // Three across, allowing for the container padding and the two gaps.
    flexBasis: '30%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },

  hint: { fontSize: fontSizes.caption },
});
