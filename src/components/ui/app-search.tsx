import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';

import { AppIconButton } from './app-icon-button';

/**
 * A search field. It is a controlled input so the caller owns debouncing and
 * query cancellation; this component deliberately knows nothing about fetching.
 */
export function AppSearch({
  value,
  onChangeText,
  placeholder = 'Search',
  label,
  onSubmit,
  testID,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  /** Accessible name, e.g. "Search Ajo groups". */
  label: string;
  onSubmit?: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={colors.textSubtle}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
        testID={testID}
        value={value}
      />
      {value.length > 0 ? (
        <AppIconButton
          icon="close-circle"
          label="Clear search"
          size={18}
          onPress={() => onChangeText('')}
          style={styles.clear}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.body,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
  },
  // The clear control keeps its own hit area without stretching the field height.
  clear: { minHeight: 32, minWidth: 32 },
});
