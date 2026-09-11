# Theme

## Foundations

Primary is navy `#0D1B3D`; secondary teal is `#15B0B8`. These exact brand values anchor actions,
links, focus, and selected states. Generated scales in `src/theme/colors.ts` provide pressed and soft
surfaces without replacing the anchors. The primary is near-black, so its pressed state is a _lighter_
step rather than a darker one — darkening it further would not be visible. The reference website's green/gold palette, shadows,
borders, and fonts are explicitly excluded.

Semantic tokens are: background, surface, surfaceElevated, surfaceMuted, primary, primaryPressed,
primarySoft, secondary, secondaryPressed, secondarySoft, text, textMuted, textSubtle, textInverse,
border, borderStrong, divider, success/successSoft, warning/warningSoft, error/errorSoft,
info/infoSoft, overlay, scrim, inputBackground, inputBorder, cardBackground, headerBackground,
tabBarBackground, disabled, placeholder, link, and focus. Both modes expose the identical key set.

Light mode uses near-white/slate surfaces with dark text. Dark mode uses navy surfaces rather than
pure black, light text, stronger borders, and dark semantic soft fills. Native headers and status
bars use resolved tokens. Nested stacks also set their scene background explicitly, while the root
native view follows `background`, preventing white system-edge or transition gaps around dark
screens. Do not use a raw palette value from a screen when a semantic token exists.

## Typography and geometry

Poppins is loaded at runtime in the root layout in weights 400 Regular, 500 Medium, 600 SemiBold,
and 700 Bold. Components use the names in `fontFamilies`; avoid synthetic weights. Body text starts
at 16sp, captions at 12sp, titles at 20sp, headings at 28sp, and display at 34sp, but text containers
must expand with font scaling. Display is reserved for a screen's single headline figure, such as the
Home wallet balance; a screen with two of them has no headline. Spacing follows 4/8/16/24/32/48 and
radii 8/12/18/24/pill, where 24 is the largest panel radius and belongs to full-bleed hero cards.
Interactive targets are at least 48dp.

Shadows are reserved for hierarchy that borders/surface changes cannot express. Prefer subtle iOS
shadow plus low Android elevation, never copy website shadows. Use one clear icon family per
platform context, label icon-only controls, and never use an icon or color alone for status.

## Usage and contrast

```tsx
const { colors } = useTheme();
return <View style={{ backgroundColor: colors.surface }} />;
```

Use primary with inverse text for main actions, secondary selectively, and semantic status pairs for
badges and messages. Check normal text at 4.5:1 and large text/UI graphics at 3:1. Focus, pressed,
disabled, error, and selected states must remain distinguishable without color. New tokens require a
documented repeated purpose, both modes, contrast review, and a token-availability test.
