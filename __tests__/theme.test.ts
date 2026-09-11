import { resolveThemeMode } from '@/hooks/use-theme';
import { themes } from '@/theme';

describe('theme foundation', () => {
  it('resolves system and explicit preferences', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', null)).toBe('light');
    expect(resolveThemeMode('light', 'dark')).toBe('light');
  });

  /** WCAG relative luminance. */
  function luminance(hex: string): number {
    const channels = [0, 2, 4].map(
      (offset) => parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255,
    );
    const [r, g, b] = channels.map((c) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  it('keeps the dark palette readable', () => {
    // The brand navy is a light-mode value: on a dark card it measured 1.03:1,
    // an accent nobody could see. Dark mode carries its own primary, and these
    // pairs are the ones that failed — a future palette edit that reintroduces
    // an invisible accent fails here rather than in somebody's hands.
    const dark = themes.dark;

    expect(contrast(dark.text, dark.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.textMuted, dark.cardBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.textSubtle, dark.cardBackground)).toBeGreaterThanOrEqual(4.5);

    // UI graphics and icons: 3:1. The tab bar carries the active tint.
    expect(contrast(dark.primary, dark.background)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.primary, dark.cardBackground)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.primary, dark.tabBarBackground)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.primary, dark.primarySoft)).toBeGreaterThanOrEqual(3);

    // primary also fills buttons, where textInverse sits on top. That token
    // stays white because the Home hero and AppAmount draw it on the brand
    // gradient, so the fill has to stay dark enough to carry white text.
    expect(contrast(dark.textInverse, dark.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('provides every semantic token in both modes', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
    expect(themes.light.primary).toBe('#0D1B3D');
    expect(themes.dark.secondary).toBe('#15B0B8');
  });
});
