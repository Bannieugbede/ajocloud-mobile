import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * Slide artwork is drawn with react-native-svg rather than shipped as bitmaps so
 * every shape can read live theme tokens, stay crisp at any density, and add no
 * binary assets to the bundle.
 */
export type SlideIllustrationProps = {
  /** Rendered box; the canvas scales to it while preserving aspect ratio. */
  size: number;
};

const VIEWBOX = 200;

function useArtColors() {
  const { colors } = useTheme();
  return {
    primary: colors.primary,
    secondary: colors.secondary,
    soft: colors.primarySoft,
    softAlt: colors.secondarySoft,
    surface: colors.surface,
    line: colors.borderStrong,
  };
}

/** Slide 1 — a circle of members contributing to one shared pool. */
export function ContributeIllustration({ size }: SlideIllustrationProps) {
  const c = useArtColors();
  const members = [0, 1, 2, 3, 4, 5];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      <Defs>
        <LinearGradient id="pool" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.primary} />
          <Stop offset="1" stopColor={c.secondary} />
        </LinearGradient>
      </Defs>
      <Circle cx="100" cy="100" r="86" fill={c.soft} />
      <Circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke={c.line}
        strokeDasharray="5 7"
        strokeWidth="2"
      />
      {members.map((index) => {
        const angle = (index / members.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <G key={index}>
            <Circle
              cx={100 + Math.cos(angle) * 62}
              cy={100 + Math.sin(angle) * 62}
              r="15"
              fill={c.surface}
              stroke={index % 2 === 0 ? c.primary : c.secondary}
              strokeWidth="3"
            />
            <Circle
              cx={100 + Math.cos(angle) * 62}
              cy={100 + Math.sin(angle) * 62 - 4}
              r="5"
              fill={index % 2 === 0 ? c.primary : c.secondary}
            />
            <Path
              d={`M ${100 + Math.cos(angle) * 62 - 7} ${100 + Math.sin(angle) * 62 + 9}
                  a 7 7 0 0 1 14 0`}
              fill={index % 2 === 0 ? c.primary : c.secondary}
            />
          </G>
        );
      })}
      <Circle cx="100" cy="100" r="32" fill="url(#pool)" />
      <Path
        d="M100 84v32M89 93h16a7 7 0 0 1 0 14H92"
        stroke={c.surface}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Slide 2 — an Akawo goal filling toward its target. */
export function GoalIllustration({ size }: SlideIllustrationProps) {
  const c = useArtColors();
  const bars = [
    { x: 44, height: 38 },
    { x: 80, height: 62 },
    { x: 116, height: 88 },
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      <Defs>
        <LinearGradient id="fill" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={c.primary} />
          <Stop offset="1" stopColor={c.secondary} />
        </LinearGradient>
      </Defs>
      <Circle cx="100" cy="100" r="86" fill={c.softAlt} />
      <Rect x="30" y="52" width="140" height="106" rx="16" fill={c.surface} />
      {bars.map((bar) => (
        <G key={bar.x}>
          <Rect x={bar.x} y={136 - 88} width="24" height="88" rx="12" fill={c.soft} />
          <Rect
            x={bar.x}
            y={136 - bar.height}
            width="24"
            height={bar.height}
            rx="12"
            fill="url(#fill)"
          />
        </G>
      ))}
      <Path
        d="M44 62l28-16 28 10 32-22"
        stroke={c.secondary}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="132" cy="34" r="8" fill={c.primary} />
    </Svg>
  );
}

/** Slide 3 — a secured wallet, for payouts arriving on schedule. */
export function SecureWalletIllustration({ size }: SlideIllustrationProps) {
  const c = useArtColors();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      <Defs>
        <LinearGradient id="card" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c.primary} />
          <Stop offset="1" stopColor={c.secondary} />
        </LinearGradient>
      </Defs>
      <Circle cx="100" cy="100" r="86" fill={c.soft} />
      <Rect x="34" y="66" width="132" height="84" rx="18" fill="url(#card)" />
      <Rect x="34" y="92" width="132" height="14" fill={c.surface} opacity="0.28" />
      <Rect x="112" y="116" width="42" height="10" rx="5" fill={c.surface} opacity="0.6" />
      <Circle cx="150" cy="108" r="26" fill={c.surface} />
      <Path
        d="M150 96a9 9 0 0 1 9 9v5h-18v-5a9 9 0 0 1 9-9z"
        fill="none"
        stroke={c.primary}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <Rect x="137" y="108" width="26" height="20" rx="5" fill={c.primary} />
      <Path d="M62 46l6 12 12 6-12 6-6 12-6-12-12-6 12-6z" fill={c.secondary} />
    </Svg>
  );
}
