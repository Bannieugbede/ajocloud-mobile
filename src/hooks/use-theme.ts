import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/theme-store';
import { themes, type ThemeMode } from '@/theme';

export function resolveThemeMode(
  preference: 'system' | ThemeMode,
  systemScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
): ThemeMode {
  return preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
}

export function useTheme() {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);
  const mode = resolveThemeMode(preference, systemScheme);

  return { colors: themes[mode], mode, preference };
}
