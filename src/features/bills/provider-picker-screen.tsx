import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { BillBiller } from '@/api/endpoints/bill-payments';
import { AppSearch } from '@/components/ui/app-search';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, sizes, spacing } from '@/theme';

import type { BillCategoryKind } from './bill-catalog-view';
import { ProviderBadge } from './bill-ui';

/**
 * Every provider in a category, searchable. Opened from the provider row or
 * the network badge; choosing one returns to the form with it selected.
 */
export function ProviderPickerScreen({
  kind,
  billers,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  kind: BillCategoryKind | null;
  billers?: BillBiller[];
  selectedId: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (biller: BillBiller) => void;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const shown = (billers ?? []).filter(
    (biller) =>
      !needle ||
      biller.name.toLowerCase().includes(needle) ||
      biller.providerCode.toLowerCase().includes(needle),
  );

  return (
    <FlatList
      data={shown}
      keyExtractor={(biller) => biller.id}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppSearch value={query} onChangeText={setQuery} label="Search providers" />
          {loading ? <AppSkeletonCard testID="providers-skeleton" /> : null}
          {error ? (
            <AppErrorState
              title="Could not load providers"
              description="Check your connection and try again."
              onRetry={onRetry}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <AppEmptyState
            icon="search-outline"
            tone="neutral"
            title="No provider found"
            description="Try a shorter name."
          />
        ) : null
      }
      renderItem={({ item, index }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={item.name}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.row,
              {
                borderTopColor: colors.divider,
                borderTopWidth: index === 0 ? 0 : 1,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ProviderBadge name={item.name} kind={kind} />
            <View style={styles.text}>
              <AppText weight={selected ? 'semibold' : 'regular'} style={styles.name}>
                {item.name}
              </AppText>
              <AppText style={[styles.code, { color: colors.success }]}>
                {item.providerCode}
              </AppText>
            </View>
            {selected ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.primary}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget + 16,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, gap: 2 },
  name: { fontSize: fontSizes.body },
  code: { fontSize: fontSizes.caption },
});
