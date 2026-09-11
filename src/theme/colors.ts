export const brand = {
  primary: '#0D1B3D',
  secondary: '#15B0B8',
} as const;

export const palette = {
  white: '#FFFFFF',
  black: '#07111F',
  blue50: '#ECEFF7',
  blue100: '#D6DCEB',
  blue300: '#7F8CB0',
  blue500: brand.primary,
  // The brand navy is near-black, so a pressed state cannot be a darker shade
  // of it — the change would not be visible. Pressed goes lighter instead, and
  // blue700 is kept as the deepest step for gradients that need one.
  blue600: '#1B2B52',
  blue700: '#070F26',
  teal50: '#E6F9FA',
  teal100: '#C8F0F2',
  teal400: brand.secondary,
  teal500: '#108E95',
  teal700: '#09656A',
  slate50: '#F7F9FC',
  slate100: '#EEF2F7',
  slate200: '#DCE3EC',
  slate300: '#C1CBD8',
  slate500: '#66758A',
  slate600: '#4A596D',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#101827',
  green50: '#EAF8EF',
  green500: '#198754',
  amber50: '#FFF6DD',
  amber500: '#A86400',
  red50: '#FDECEC',
  red400: '#E45252',
  red500: '#C93636',
  sky50: '#EAF7FF',
  sky500: '#087AAE',
} as const;
