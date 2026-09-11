import { brand, palette } from './colors';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | ThemeMode;

const common = {
  primary: brand.primary,
  primaryPressed: palette.blue600,
  primarySoft: palette.blue50,
  secondary: brand.secondary,
  secondaryPressed: palette.teal500,
  secondarySoft: palette.teal50,
  success: palette.green500,
  successSoft: palette.green50,
  warning: palette.amber500,
  warningSoft: palette.amber50,
  error: palette.red500,
  errorSoft: palette.red50,
  info: palette.sky500,
  infoSoft: palette.sky50,
  textInverse: palette.white,
  link: brand.primary,
  focus: brand.secondary,
} as const;

export const themes = {
  light: {
    ...common,
    background: palette.slate50,
    surface: palette.white,
    surfaceElevated: palette.white,
    surfaceMuted: palette.slate100,
    text: palette.slate900,
    textMuted: palette.slate600,
    textSubtle: palette.slate500,
    border: palette.slate200,
    borderStrong: palette.slate300,
    divider: palette.slate200,
    overlay: 'rgba(7, 17, 31, 0.54)',
    scrim: 'rgba(7, 17, 31, 0.72)',
    inputBackground: palette.white,
    inputBorder: palette.slate300,
    cardBackground: palette.white,
    headerBackground: palette.white,
    tabBarBackground: palette.white,
    disabled: palette.slate200,
    placeholder: palette.slate500,
  },
  dark: {
    ...common,
    // The brand navy is a light-mode value. On a dark ground it measures 1.03:1
    // against a card — an accent nobody can see — so dark mode carries its own
    // lighter primary. It is deliberately not the lightest legible blue: the
    // same token fills buttons, where `textInverse` white must stay readable on
    // top, so this value answers to both (3.5:1 as a mark on a card, 4.8:1 for
    // white text on the fill).
    primary: '#4470C6',
    primaryPressed: '#5A83D4',
    primarySoft: '#18253F',
    secondarySoft: '#10383C',
    successSoft: '#133524',
    warningSoft: '#3D2E0B',
    errorSoft: '#421D22',
    infoSoft: '#123244',
    link: '#7AA0E8',
    // Backgrounds are navy-tinted rather than the old near-neutral slate, so
    // the dark theme reads as the same brand family as the light one. Each step
    // up the stack is a visible lift without becoming grey.
    background: '#0A1020',
    surface: '#141C2E',
    surfaceElevated: '#1C263B',
    surfaceMuted: '#26324A',
    text: '#F2F5FA',
    textMuted: '#B9C4D4',
    textSubtle: '#94A1B5',
    border: '#2C3850',
    borderStrong: '#44546F',
    divider: '#2A3650',
    overlay: 'rgba(0, 0, 0, 0.60)',
    scrim: 'rgba(0, 0, 0, 0.78)',
    inputBackground: '#141C2E',
    inputBorder: '#44546F',
    cardBackground: '#141C2E',
    headerBackground: '#0F1728',
    tabBarBackground: '#0F1728',
    disabled: '#37445C',
    placeholder: '#94A1B5',
  },
} as const;

export type ThemeTokens = (typeof themes)[ThemeMode];
