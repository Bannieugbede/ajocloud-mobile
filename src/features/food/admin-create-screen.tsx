import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { CreateFoodProgrammeInput } from '@/api/endpoints/food-ajo';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppKeyboardScrollView } from '@/components/ui/app-keyboard';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

const FREQUENCIES = ['WEEKLY', 'MONTHLY'] as const;
const FULFILMENT = ['PICKUP', 'DELIVERY', 'DELIVERY_OR_PICKUP'] as const;
const isoExample = (daysAhead: number) =>
  new Date(Date.now() + daysAhead * 86_400_000).toISOString();

export function AdminCreateFoodScreen({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (input: CreateFoodProgrammeInput) => void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>('WEEKLY');
  const [capacity, setCapacity] = useState('');
  const [fulfilment, setFulfilment] = useState<(typeof FULFILMENT)[number]>('PICKUP');
  const [startsAt, setStartsAt] = useState(isoExample(14));
  const [endsAt, setEndsAt] = useState(isoExample(60));
  const [distributionAt, setDistributionAt] = useState(isoExample(60));
  const [packageName, setPackageName] = useState('');
  const [price, setPrice] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (
      name.trim().length < 3 ||
      !/^\d+$/.test(amount) ||
      Number(amount) <= 0 ||
      !/^\d+$/.test(capacity) ||
      Number(capacity) <= 0 ||
      !packageName.trim() ||
      !/^\d+$/.test(price) ||
      Number(price) <= 0 ||
      !itemName.trim() ||
      !quantity.trim() ||
      !unit.trim()
    ) {
      setError('Complete each field with a valid value. Amounts are in kobo.');
      return;
    }
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const distribution = new Date(distributionAt);
    if (
      [start, end, distribution].some((date) => Number.isNaN(date.getTime())) ||
      end <= start ||
      distribution < start
    ) {
      setError('Check the programme dates. Use ISO date and time.');
      return;
    }
    setError('');
    onSubmit({
      name: name.trim(),
      contributionMinor: amount,
      contributionFrequency: frequency,
      enrolmentCapacity: Number(capacity),
      fulfilmentMethod: fulfilment,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      distributionAt: distribution.toISOString(),
      packages: [
        {
          name: packageName.trim(),
          priceMinor: price,
          items: [{ name: itemName.trim(), quantity: quantity.trim(), unit: unit.trim() }],
        },
      ],
    });
  };

  return (
    <AppKeyboardScrollView
      contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
      footer={
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <AppButton label="Create food group" onPress={submit} loading={submitting} />
        </View>
      }
    >
      <AppCard style={styles.section}>
        <AppText accessibilityRole="header" weight="bold">
          Programme
        </AppText>
        <AppInput
          label="Group name"
          placeholder="e.g. Friday Family Market"
          value={name}
          onChangeText={setName}
          icon={<Ionicons name="people-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Contribution (kobo)"
          placeholder="e.g. 250000"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          icon={<Ionicons name="cash-outline" size={19} color={colors.textMuted} />}
        />
        <ChoiceRow
          label="Contribution frequency"
          values={FREQUENCIES}
          value={frequency}
          onChange={setFrequency}
        />
        <AppInput
          label="Portion capacity"
          placeholder="e.g. 80"
          keyboardType="number-pad"
          value={capacity}
          onChangeText={setCapacity}
          icon={<Ionicons name="people-circle-outline" size={19} color={colors.textMuted} />}
        />
        <ChoiceRow
          label="Fulfilment"
          values={FULFILMENT}
          value={fulfilment}
          onChange={setFulfilment}
        />
        <AppInput
          label="Starts at (ISO date/time)"
          placeholder="2026-10-15T09:00:00.000Z"
          value={startsAt}
          onChangeText={setStartsAt}
          icon={<Ionicons name="calendar-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Ends at (ISO date/time)"
          placeholder="2026-11-30T09:00:00.000Z"
          value={endsAt}
          onChangeText={setEndsAt}
          icon={<Ionicons name="calendar-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Distribution at (ISO date/time)"
          placeholder="2026-11-30T09:00:00.000Z"
          value={distributionAt}
          onChangeText={setDistributionAt}
          icon={<Ionicons name="time-outline" size={19} color={colors.textMuted} />}
        />
      </AppCard>
      <AppCard style={styles.section}>
        <AppText accessibilityRole="header" weight="bold">
          First package
        </AppText>
        <AppInput
          label="Package name"
          placeholder="e.g. Family basket"
          value={packageName}
          onChangeText={setPackageName}
          icon={<Ionicons name="basket-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Package price (kobo)"
          placeholder="e.g. 1500000"
          keyboardType="number-pad"
          value={price}
          onChangeText={setPrice}
          icon={<Ionicons name="pricetag-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Item name"
          placeholder="e.g. Rice"
          value={itemName}
          onChangeText={setItemName}
          icon={<Ionicons name="cube-outline" size={19} color={colors.textMuted} />}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <AppInput
              label="Quantity"
              placeholder="e.g. 5"
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
              icon={<Ionicons name="calculator-outline" size={19} color={colors.textMuted} />}
            />
          </View>
          <View style={styles.flex}>
            <AppInput
              label="Unit"
              placeholder="kg"
              value={unit}
              onChangeText={setUnit}
              icon={<Ionicons name="resize-outline" size={19} color={colors.textMuted} />}
            />
          </View>
        </View>
      </AppCard>
      {error ? (
        <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
          {error}
        </AppText>
      ) : null}
    </AppKeyboardScrollView>
  );
}

function ChoiceRow<T extends string>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.choice}>
      <AppText weight="semibold">{label}</AppText>
      <View style={styles.wrap}>
        {values.map((option) => (
          <AppButton
            key={option}
            label={option.replaceAll('_', ' ')}
            variant={option === value ? 'secondary' : 'outline'}
            size="compact"
            onPress={() => onChange(option)}
            style={option === value ? undefined : { borderColor: colors.border }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  footer: { padding: spacing.md },
  section: { gap: spacing.md },
  choice: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
