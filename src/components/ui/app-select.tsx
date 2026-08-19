import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';
import { AppText } from './app-text';

export type SelectOption = { value: string; label: string };

type AppSelectProps = {
  label: string;
  value: string | null;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Shows a filter box. Worth it for long lists such as banks. */
  searchable?: boolean;
  disabled?: boolean;
  testID?: string;
};

/**
 * A native select built from a Modal and a list, rather than a picker
 * dependency. Both platforms get the same sheet, the same search, and the same
 * announced state; no new dependency is introduced for one control.
 *
 * The trigger is a button whose value is part of its label, so a screen reader
 * announces the current selection without the visual pairing.
 */
export function AppSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  error,
  searchable = false,
  disabled = false,
  testID,
}: AppSelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);
  const visible = useMemo(() => {
    if (!searchable || query.trim() === '') return options;
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query, searchable]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const renderOption = ({ item }: ListRenderItemInfo<SelectOption>) => {
    const isSelected = item.value === value;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        onPress={() => {
          onChange(item.value);
          close();
        }}
        style={({ pressed }) => [
          styles.option,
          { backgroundColor: pressed ? colors.primarySoft : 'transparent' },
        ]}
      >
        <AppText style={styles.optionLabel}>{item.label}</AppText>
        {isSelected ? (
          <Ionicons
            accessibilityElementsHidden
            importantForAccessibility="no"
            name="checkmark"
            size={20}
            color={colors.primary}
          />
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.group}>
      <AppText weight="semibold" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        // The value rides on the label so it is announced with the control.
        accessibilityLabel={`${label}. ${selected ? selected.label : placeholder}`}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        testID={testID}
      >
        <AppText
          numberOfLines={1}
          style={[styles.value, { color: selected ? colors.text : colors.placeholder }]}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <Ionicons
          accessibilityElementsHidden
          importantForAccessibility="no"
          name="chevron-down"
          size={18}
          color={colors.textSubtle}
        />
      </Pressable>
      {error ? (
        <AppText accessibilityLiveRegion="polite" style={[styles.error, { color: colors.error }]}>
          {error}
        </AppText>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={close}
        presentationStyle="pageSheet"
        visible={open}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.sheetHeader}>
            <AppText accessibilityRole="header" weight="bold" style={styles.sheetTitle}>
              {label}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={spacing.sm}
              onPress={close}
              style={styles.close}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          {searchable ? (
            <View
              style={[
                styles.search,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
            >
              <Ionicons
                accessibilityElementsHidden
                importantForAccessibility="no"
                name="search"
                size={18}
                color={colors.textSubtle}
              />
              <TextInput
                accessibilityLabel={`Search ${label.toLowerCase()}`}
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={colors.placeholder}
                style={[styles.searchInput, { color: colors.text }]}
                value={query}
              />
            </View>
          ) : null}
          <FlatList
            data={visible}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <AppText style={[styles.empty, { color: colors.textMuted }]}>
                Nothing matches that search.
              </AppText>
            }
            renderItem={renderOption}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: fontSizes.caption },
  field: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
  },
  value: { flex: 1, fontSize: fontSizes.body },
  error: { fontSize: fontSizes.caption },
  sheet: { flex: 1, padding: spacing.lg },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: fontSizes.title },
  close: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
  },
  search: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.body,
    minHeight: sizes.touchTarget,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionLabel: { flex: 1, fontSize: fontSizes.body },
  empty: { padding: spacing.lg, textAlign: 'center' },
});
