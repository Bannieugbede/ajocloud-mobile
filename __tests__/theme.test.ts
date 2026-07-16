import { resolveThemeMode } from '@/hooks/use-theme';
import { themes } from '@/theme';

describe('theme foundation', () => {
  it('resolves system and explicit preferences', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', null)).toBe('light');
    expect(resolveThemeMode('light', 'dark')).toBe('light');
  });

  it('provides every semantic token in both modes', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
    expect(themes.light.primary).toBe('#0D47A1');
    expect(themes.dark.secondary).toBe('#15B0B8');
  });
});
