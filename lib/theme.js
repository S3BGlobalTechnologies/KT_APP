/**
 * Kundli Time — shared design tokens (theme-aware).
 *
 * Two palettes share IDENTICAL keys:
 *   - darkColors  — the original "cosmic" dark look (deep indigo + gold).
 *                   Values are byte-for-byte the originals; do NOT change them.
 *   - lightColors — the warm "Daylight Almanac" look (cream + deep green + gold).
 *
 * Components must not hardcode hex. Read the active palette from
 * `useTheme().colors` (see contexts/ThemeContext) and build styles with a
 * `makeStyles(colors)` factory so they re-render on theme change.
 *
 * `spacing`, `radius`, `typography` are theme-independent and stay static.
 * The default `colors` export is the DARK palette so any not-yet-migrated file
 * keeps rendering exactly as before.
 */

// ── DARK (original cosmic) — unchanged ───────────────────────────────────────
export const darkColors = {
  // Backgrounds
  bg: '#0B0A2E',
  bgGradient: ['#0B0A2E', '#120C38', '#0A0824'],

  // Surfaces (translucent cards on the gradient)
  surface: 'rgba(255,255,255,0.045)',
  surfaceStrong: 'rgba(255,255,255,0.07)',
  surfaceBorder: 'rgba(255,255,255,0.09)',
  hairline: 'rgba(255,255,255,0.10)',

  // Solid raised surfaces (opaque modals / dropdowns / avatars)
  elevated: '#171436',   // modal card
  sunken: '#120F30',     // dropdown / sunken panel
  avatarBg: '#1B1740',   // avatar circle
  band: '#0b142e',       // contrasting footer/strip band

  // Brand gold
  gold: '#E4AD0D',
  goldText: '#E4AD0D',        // gold used as TEXT (same as gold in dark)
  goldGradient: ['#F4C752', '#E0A320'],
  goldSoftBg: 'rgba(228,173,13,0.14)',
  goldSoftBorder: 'rgba(228,173,13,0.35)',
  goldRing: 'rgba(228,173,13,0.5)',
  onGold: '#231A05',
  primarySolid: '#E4AD0D',    // solid primary fill (buttons/bubbles) = gold in dark
  onPrimary: '#231A05',

  // Text
  text: '#FFFFFF',
  textMuted: '#B9B4D6',
  textSubtle: '#9C97BE',
  textSoft: '#C9C4E4',

  // Semantic
  success: '#3BD16F',
  online: '#3BD16F',
  danger: '#FF6B6B',
  info: '#0D9488',
  warning: '#F59E0B',
  accent: '#7C3AED',

  // Control chrome
  ctrlBg: 'rgba(255,255,255,0.06)',
  ctrlBorder: 'rgba(255,255,255,0.18)',
};

// ── LIGHT ("Daylight Almanac") — cream + deep green + gold ────────────────────
export const lightColors = {
  // Backgrounds — warm cream page + sky gradient (never pure white)
  bg: '#FFF8F0',
  bgGradient: ['#FFFDF8', '#FFF8F0', '#F7EFE0'],

  // Surfaces
  surface: '#FFFFFF',          // cards
  surfaceStrong: '#F7F5EF',    // elevated
  surfaceBorder: '#E6E2D9',
  hairline: '#E6E2D9',

  // Solid raised surfaces (opaque modals / dropdowns / avatars)
  elevated: '#FFFFFF',   // modal card
  sunken: '#F3F1EC',     // dropdown / sunken panel
  avatarBg: '#F1F6EF',   // avatar circle
  band: '#F7F5EF',       // contrasting footer/strip band

  // Gold — accents/icons/borders only (never large fills, never body text)
  gold: '#B8861B',             // icons / small accents
  goldText: '#8A6410',         // gold TEXT (passes 4.5:1 on cream)
  goldGradient: ['#1F3E70', '#14284A', '#0A1526'], // PRIMARY action = deep navy, stronger gradient
  goldSoftBg: 'rgba(184,134,27,0.14)',
  goldSoftBorder: 'rgba(184,134,27,0.45)',
  goldRing: 'rgba(184,134,27,0.5)',
  onGold: '#FFF8F0',           // cream text on green buttons
  primarySolid: '#16294B',     // solid primary fill = deep navy in light
  onPrimary: '#FFF8F0',

  // Ink (never pure black)
  text: '#1A1A1A',
  textMuted: '#4A4A4A',
  textSubtle: '#706F6A',
  textSoft: '#4A4A4A',

  // Semantic
  success: '#2E7D32',
  online: '#2E7D32',
  danger: '#E74C3C',
  info: '#0D9488',
  warning: '#F59E0B',
  accent: '#7C3AED',

  // Control chrome
  ctrlBg: '#F1F6EF',           // hover / tinted surface
  ctrlBorder: '#E6E2D9',
};

export const palettes = { dark: darkColors, light: lightColors };

export function getColors(mode) {
  return mode === 'light' ? lightColors : darkColors;
}

// Default export stays DARK so un-migrated modules render exactly as before.
export const colors = darkColors;

export const spacing = {
  gutter: 16,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
};

export const typography = {
  screenTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  body: { fontSize: 14.5, color: colors.textMuted, lineHeight: 22 },
  subtle: { fontSize: 13, color: colors.textMuted },
};

export default { colors, darkColors, lightColors, palettes, getColors, spacing, radius, typography };
