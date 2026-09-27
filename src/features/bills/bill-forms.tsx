import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppKeyboardScrollView } from '@/components/ui/app-keyboard';

import type { BillBiller, BillProduct } from '@/api/endpoints/bill-payments';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount, majorToMinor, minorToMajor } from '@/utils/money';

import { amountError } from './bill-amount';
import {
  amountPresets,
  billerForNetwork,
  detectNetwork,
  PLAN_PERIOD_LABELS,
  planPeriods,
  plansFor,
  planSize,
  type BillCategoryKind,
  type PlanPeriod,
} from './bill-catalog-view';
import {
  normaliseReference,
  referenceKeyboard,
  referencePlaceholder,
  referenceProblem,
} from './bill-reference';
import {
  AmountEntry,
  AmountTiles,
  BillSection,
  billStyles,
  Pill,
  ProviderField,
  ReferenceCard,
  ReferenceHeader,
} from './bill-ui';

/**
 * The four ways a bill is paid, one screen each, laid out after the reference
 * designs: Airtime and Internet lead with the phone number and its network,
 * Electricity and Cable TV with the provider. Every screen ends by handing the
 * choice to the confirmation, which checks the number with the provider before
 * any money moves.
 */

export type BillChoice = {
  biller: BillBiller;
  product: BillProduct | null;
  customerReference: string;
  amountMinor: string;
};

export type BillFormProps = {
  billers: BillBiller[];
  /** The chosen provider, owned by the route so the provider list can set it. */
  biller: BillBiller | null;
  /** True once the payer picked a provider, which stops network detection overriding it. */
  providerChosen: boolean;
  initialAmountMinor?: string;
  onSelectBiller: (billerId: string) => void;
  onOpenProviders: () => void;
  onContinue: (choice: BillChoice) => void;
};

/**
 * Loading, failure and emptiness for every bill screen, so each form only
 * describes the happy path.
 */
export function BillCategoryScreen({
  kind,
  billers,
  loading,
  error,
  onRetry,
  ...form
}: Omit<BillFormProps, 'billers'> & {
  kind: BillCategoryKind;
  billers?: BillBiller[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const { colors } = useTheme();

  let body: ReactNode;
  if (loading) body = <AppSkeletonCard testID="billers-skeleton" />;
  else if (error)
    body = (
      <AppErrorState
        title="Could not load providers"
        description="The list of providers could not be loaded. Check your connection and try again."
        onRetry={onRetry}
      />
    );
  else if (!billers?.length)
    body = (
      <AppEmptyState
        icon="business-outline"
        tone="neutral"
        title="No providers here yet"
        description="There is nothing to pay in this category right now. Try another category."
      />
    );
  else {
    const props = { ...form, billers };
    body =
      kind === 'airtime' ? (
        <AirtimeForm {...props} />
      ) : kind === 'internet' ? (
        <DataForm {...props} />
      ) : kind === 'electricity' ? (
        <ElectricityForm {...props} />
      ) : (
        <CableForm {...props} />
      );
  }

  return (
    <AppKeyboardScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {body}
    </AppKeyboardScrollView>
  );
}

/**
 * The number, tidied and checked for this biller. Detection only runs while the
 * payer has not chosen a network themselves, since a number may be ported.
 */
function useReference({
  billers,
  biller,
  providerChosen,
  onSelectBiller,
}: Pick<BillFormProps, 'billers' | 'biller' | 'providerChosen' | 'onSelectBiller'>) {
  const [reference, setReference] = useState('');
  const [touched, setTouched] = useState(false);
  const kind = biller?.referenceKind ?? null;
  const problem = referenceProblem(kind, reference);

  const change = (value: string) => {
    setReference(value);
    setTouched(false);
    if (providerChosen || kind !== 'phone') return;
    const network = detectNetwork(normaliseReference('phone', value));
    const match = network ? billerForNetwork(billers, network) : null;
    if (match && match.id !== biller?.id) onSelectBiller(match.id);
  };

  return {
    reference,
    normalised: normaliseReference(kind, reference),
    kind,
    problem,
    error: touched ? problem : null,
    touch: () => setTouched(true),
    change,
  };
}

/** Amount presets a product accepts, in minor units. */
function presetsFor(kind: BillCategoryKind, product: BillProduct | null): string[] {
  return amountPresets(kind)
    .map((naira) => majorToMinor(String(naira)))
    .filter((minor): minor is string => minor !== null && amountError(product, minor) === null);
}

/** An amount typed by the payer, or chosen from the tiles. */
function useAmount(product: BillProduct | null, initialAmountMinor?: string) {
  const [major, setMajor] = useState(initialAmountMinor ? minorToMajor(initialAmountMinor) : '');
  const [touched, setTouched] = useState(false);
  const minor = majorToMinor(major);
  const problem = amountError(product, minor);
  return {
    major,
    minor,
    problem,
    error: touched ? problem : null,
    set: (value: string) => {
      setMajor(value);
      setTouched(false);
    },
    touch: () => setTouched(true),
  };
}

function AirtimeForm(props: BillFormProps) {
  const { biller, onOpenProviders, onContinue, initialAmountMinor } = props;
  const reference = useReference(props);
  const product = biller?.products[0] ?? null;
  const amount = useAmount(product, initialAmountMinor);

  const submit = (amountMinor: string | null) => {
    reference.touch();
    amount.touch();
    if (!biller || reference.problem || !amountMinor || amountError(product, amountMinor)) return;
    onContinue({ biller, product, customerReference: reference.normalised, amountMinor });
  };

  return (
    <>
      <ReferenceHeader
        providerName={biller?.name ?? null}
        kind="airtime"
        label={biller?.referenceLabel ?? 'Phone number'}
        value={reference.reference}
        placeholder={referencePlaceholder('phone')}
        keyboardType="phone-pad"
        error={reference.error}
        onChangeText={reference.change}
        onOpenProviders={onOpenProviders}
      />
      <BillSection title="Top up">
        <AmountTiles
          amountsMinor={presetsFor('airtime', product)}
          selectedMinor={amount.minor}
          onSelect={(amountMinor) => {
            amount.set(minorToMajor(amountMinor));
            submit(amountMinor);
          }}
        />
        <AmountEntry
          value={amount.major}
          error={amount.error}
          onChangeText={amount.set}
          onPay={() => submit(amount.minor)}
        />
      </BillSection>
    </>
  );
}

function DataForm(props: BillFormProps) {
  const { biller, onOpenProviders, onContinue } = props;
  const { colors } = useTheme();
  const reference = useReference(props);
  const [period, setPeriod] = useState<PlanPeriod>('all');

  const products = biller?.products ?? [];
  const periods = planPeriods(products);
  const shown = plansFor(products, periods.includes(period) ? period : 'all');

  const choose = (product: BillProduct) => {
    reference.touch();
    if (!biller || reference.problem || !product.fixedAmountMinor) return;
    onContinue({
      biller,
      product,
      customerReference: reference.normalised,
      amountMinor: product.fixedAmountMinor,
    });
  };

  return (
    <>
      <ReferenceHeader
        providerName={biller?.name ?? null}
        kind="internet"
        label={biller?.referenceLabel ?? 'Phone number'}
        value={reference.reference}
        placeholder={referencePlaceholder(reference.kind)}
        keyboardType={referenceKeyboard(reference.kind)}
        error={reference.error}
        onChangeText={reference.change}
        onOpenProviders={onOpenProviders}
      />
      <BillSection title="Data plans">
        {periods.length > 1 ? (
          <AppSegmented
            label="Plan length"
            options={periods.map((value) => ({ value, label: PLAN_PERIOD_LABELS[value] }))}
            value={periods.includes(period) ? period : 'all'}
            onChange={setPeriod}
          />
        ) : null}
        {shown.length ? (
          <View style={billStyles.grid}>
            {shown.map((product) => (
              <PlanTile key={product.id} product={product} onPress={() => choose(product)} />
            ))}
          </View>
        ) : (
          <AppText style={{ color: colors.textMuted }}>
            {biller ? 'No plans are available right now.' : 'Choose a network to see its plans.'}
          </AppText>
        )}
      </BillSection>
    </>
  );
}

function PlanTile({ product, onPress }: { product: BillProduct; onPress: () => void }) {
  const { colors } = useTheme();
  const size = planSize(product.name);
  const price = formatMinorAmount(product.fixedAmountMinor ?? '0', product.currency);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[product.name, product.validity, price].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        billStyles.tile,
        billStyles.thirds,
        styles.plan,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: 'transparent',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {size ? (
        <AppText weight="bold" style={styles.planSize}>
          {size.value}
          <AppText weight="semibold" style={styles.planUnit}>
            {size.unit}
          </AppText>
        </AppText>
      ) : (
        <AppText weight="bold" style={styles.planName} numberOfLines={2}>
          {product.name}
        </AppText>
      )}
      {product.validity ? (
        <AppText style={[billStyles.caption, { color: colors.textMuted }]}>
          {product.validity}
        </AppText>
      ) : null}
      <AppText weight="semibold" style={{ color: colors.primary }}>
        {price.replace(/\.00$/, '')}
      </AppText>
    </Pressable>
  );
}

function ElectricityForm(props: BillFormProps) {
  const { biller, onOpenProviders, onContinue, initialAmountMinor } = props;
  const reference = useReference(props);
  const products = biller?.products ?? [];
  const [productId, setProductId] = useState<string | null>(null);
  const product = products.find((candidate) => candidate.id === productId) ?? products[0] ?? null;
  const amount = useAmount(product, initialAmountMinor);

  const submit = (amountMinor: string | null) => {
    reference.touch();
    amount.touch();
    if (!biller || reference.problem || !amountMinor || amountError(product, amountMinor)) return;
    onContinue({ biller, product, customerReference: reference.normalised, amountMinor });
  };

  return (
    <>
      <ProviderField name={biller?.name ?? null} kind="electricity" onPress={onOpenProviders} />
      {products.length > 1 ? (
        <View accessibilityRole="radiogroup" style={styles.meterTypes}>
          {products.map((candidate) => (
            <MeterType
              key={candidate.id}
              label={candidate.name.replace(/\s+(meter|account)$/i, '')}
              selected={candidate.id === product?.id}
              onPress={() => setProductId(candidate.id)}
            />
          ))}
        </View>
      ) : null}
      <ReferenceCard
        label={biller?.referenceLabel ?? 'Meter number'}
        value={reference.reference}
        placeholder="Enter meter number"
        keyboardType="number-pad"
        error={reference.error}
        onChangeText={reference.change}
      />
      <BillSection title="Select amount">
        <AmountTiles
          amountsMinor={presetsFor('electricity', product)}
          selectedMinor={amount.minor}
          onSelect={(amountMinor) => {
            amount.set(minorToMajor(amountMinor));
            submit(amountMinor);
          }}
        />
        <AmountEntry
          value={amount.major}
          error={amount.error}
          onChangeText={amount.set}
          onPay={() => submit(amount.minor)}
        />
      </BillSection>
    </>
  );
}

/** Prepaid or Postpaid, drawn as two large cards rather than a small switch. */
function MeterType({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        billStyles.tile,
        styles.meterType,
        {
          backgroundColor: selected ? colors.primarySoft : colors.cardBackground,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <AppText
        weight="semibold"
        style={[styles.meterTypeLabel, { color: selected ? colors.primary : colors.text }]}
      >
        {label}
      </AppText>
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={colors.primary}
          style={styles.meterTypeCheck}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </Pressable>
  );
}

function CableForm(props: BillFormProps) {
  const { biller, onOpenProviders, onContinue } = props;
  const { colors } = useTheme();
  const reference = useReference(props);
  const products = biller?.products ?? [];

  const choose = (product: BillProduct) => {
    reference.touch();
    if (!biller || reference.problem || !product.fixedAmountMinor) return;
    onContinue({
      biller,
      product,
      customerReference: reference.normalised,
      amountMinor: product.fixedAmountMinor,
    });
  };

  return (
    <>
      <ProviderField name={biller?.name ?? null} kind="cable" onPress={onOpenProviders} />
      <ReferenceCard
        label={biller?.referenceLabel ?? 'Smartcard number'}
        value={reference.reference}
        placeholder={`Enter your ${(biller?.referenceLabel ?? 'smartcard number').toLowerCase()}`}
        keyboardType="number-pad"
        error={reference.error}
        onChangeText={reference.change}
      />
      <BillSection title="Packages">
        {products.length ? (
          <View style={billStyles.grid}>
            {products.map((product) => {
              const price = formatMinorAmount(product.fixedAmountMinor ?? '0', product.currency);
              return (
                <Pressable
                  key={product.id}
                  accessibilityRole="button"
                  accessibilityLabel={[
                    `${biller?.name ?? ''} ${product.name}`,
                    product.validity,
                    price,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  onPress={() => choose(product)}
                  style={({ pressed }) => [
                    billStyles.halves,
                    styles.package,
                    { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <AppText weight="semibold" style={styles.packageName} numberOfLines={2}>
                    {biller?.name} {product.name}
                  </AppText>
                  {product.validity ? <Pill>{product.validity}</Pill> : null}
                  <AppText weight="bold" style={styles.packagePrice}>
                    {price.replace(/\.00$/, '')}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <AppText style={{ color: colors.textMuted }}>
            No packages are available right now.
          </AppText>
        )}
      </BillSection>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

  plan: { gap: 2, paddingVertical: spacing.md },
  planSize: { fontSize: fontSizes.title },
  planUnit: { fontSize: fontSizes.caption },
  planName: { fontSize: fontSizes.body, textAlign: 'center' },

  meterTypes: { flexDirection: 'row', gap: spacing.sm },
  meterType: { flex: 1 },
  meterTypeLabel: { fontSize: fontSizes.body },
  meterTypeCheck: { bottom: spacing.xs, position: 'absolute', right: spacing.xs },

  package: { borderRadius: radius.md, gap: spacing.sm, padding: spacing.md },
  packageName: { fontSize: fontSizes.body },
  packagePrice: { fontSize: fontSizes.title },
});
