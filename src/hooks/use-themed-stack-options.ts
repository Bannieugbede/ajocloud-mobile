import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, type ThemeTokens } from '@/theme';

export function createThemedStackOptions(colors: ThemeTokens) {
  return {
    contentStyle: { backgroundColor: colors.background },
    headerBackButtonDisplayMode: 'minimal' as const,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.headerBackground },
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: fontFamilies.semibold },
  };
}

export function useThemedStackOptions() {
  const { colors } = useTheme();

  return createThemedStackOptions(colors);
}
