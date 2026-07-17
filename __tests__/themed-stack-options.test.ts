import { createThemedStackOptions } from '@/hooks/use-themed-stack-options';
import { themes } from '@/theme';

it('keeps native stack surfaces aligned with the light theme', () => {
  const options = createThemedStackOptions(themes.light);

  expect(options.contentStyle.backgroundColor).toBe(themes.light.background);
  expect(options.headerStyle.backgroundColor).toBe(themes.light.headerBackground);
  expect(options.headerTintColor).toBe(themes.light.text);
});

it('keeps native stack surfaces aligned with the dark theme', () => {
  const options = createThemedStackOptions(themes.dark);

  expect(options.contentStyle.backgroundColor).toBe(themes.dark.background);
  expect(options.headerStyle.backgroundColor).toBe(themes.dark.headerBackground);
  expect(options.headerTintColor).toBe(themes.dark.text);
});
