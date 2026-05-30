// frontend/src/styles/tokens.js
// Single source of design tokens for all CPA pages.
// Derived from CPASettingsSystem.jsx THEMES (authoritative brand reference).

export const DARK = {
  // Backgrounds
  bg:          '#050507',
  bg2:         '#0b0b0f',
  bg3:         '#111218',
  surf:        '#0D1117',
  card:        '#111318',
  cardHover:   '#141720',
  cardSolid:   '#111218',
  cardBorder:  'rgba(255,255,255,0.08)',
  sep:         'rgba(255,255,255,0.07)',
  glass:       'rgba(5,5,7,0.92)',
  inputBg:     'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.1)',
  sidebarBg:   '#08080c',

  // Brand
  accent:      '#8A2BFF',
  accent2:     '#4da3ff',
  accentSoft:  'rgba(138,43,255,0.13)',
  accentGlow:  'rgba(138,43,255,0.38)',
  neon:        '#b47aff',
  neon2:       '#4da3ff',
  neonCyan:    '#00e5ff',
  border:      'rgba(255,255,255,0.07)',
  borderFocus: 'rgba(138,43,255,0.45)',

  // Typography
  txt:   '#EDEEF2',
  txt2:  '#8D93A0',
  txt3:  '#4E5464',
  text:  '#f5f5f7',
  text2: '#9ca0ae',
  text3: '#3c3f4e',

  // Semantic
  purple:     '#8A2BFF',
  purpleDim:  'rgba(138,43,255,0.12)',
  blue:       '#2D7FFF',
  blueDim:    'rgba(45,127,255,0.12)',
  cyan:       '#00C9B1',
  cyanDim:    'rgba(0,201,177,0.1)',
  gold:       '#E8A020',
  goldDim:    'rgba(232,160,32,0.1)',
  red:        '#E8354A',
  redDim:     'rgba(232,53,74,0.1)',
  green:      '#22C55E',
  greenDim:   'rgba(34,197,94,0.1)',
  danger:     '#ff4560',  dangerSoft:  'rgba(255,69,96,0.12)',
  success:    '#00c896',  successSoft: 'rgba(0,200,150,0.12)',
  warning:    '#ffb340',  warningSoft: 'rgba(255,179,64,0.12)',
  badgeBg:    'rgba(138,43,255,0.18)',
  badgeText:  '#b47aff',

  // Shadows
  shadow:    '0 1px 2px rgba(0,0,0,0.5),0 3px 12px rgba(0,0,0,0.35)',
  shadowMd:  '0 4px 20px rgba(0,0,0,0.5)',
  btnShadow: '0 0 32px rgba(138,43,255,0.48),0 4px 16px rgba(0,0,0,0.4)',

  isDark: true,
};

export const LIGHT = {
  bg:          '#F2F4F8',
  bg2:         '#eeedf5',
  bg3:         '#ffffff',
  surf:        '#FFFFFF',
  card:        '#FFFFFF',
  cardHover:   '#FAFBFD',
  cardSolid:   '#ffffff',
  cardBorder:  'rgba(123,44,255,0.12)',
  sep:         'rgba(0,0,0,0.07)',
  glass:       'rgba(255,255,255,0.97)',
  inputBg:     'rgba(0,0,0,0.025)',
  inputBorder: 'rgba(0,0,0,0.1)',
  sidebarBg:   '#eeedf5',

  accent:      '#7B22EE',
  accent2:     '#2563eb',
  accentSoft:  'rgba(123,44,255,0.08)',
  accentGlow:  'rgba(123,44,255,0.18)',
  neon:        '#7b2cff',
  neon2:       '#2563eb',
  neonCyan:    '#0284c7',
  border:      'rgba(0,0,0,0.08)',
  borderFocus: 'rgba(138,43,255,0.4)',

  txt:   '#0D0F1A',
  txt2:  '#52596A',
  txt3:  '#A0A8B8',
  text:  '#141414',
  text2: '#5c5f72',
  text3: '#c8cadb',

  purple:     '#7B22EE',
  purpleDim:  'rgba(123,34,238,0.07)',
  blue:       '#1A6AE8',
  blueDim:    'rgba(26,106,232,0.07)',
  cyan:       '#009E8E',
  cyanDim:    'rgba(0,158,142,0.07)',
  gold:       '#C07A10',
  goldDim:    'rgba(192,122,16,0.07)',
  red:        '#D02B3F',
  redDim:     'rgba(208,43,63,0.07)',
  green:      '#16A34A',
  greenDim:   'rgba(22,163,74,0.07)',
  danger:     '#e5193a',  dangerSoft:  'rgba(229,25,58,0.09)',
  success:    '#059669',  successSoft: 'rgba(5,150,105,0.08)',
  warning:    '#d97706',  warningSoft: 'rgba(217,119,6,0.09)',
  badgeBg:    'rgba(123,44,255,0.1)',
  badgeText:  '#7b2cff',

  shadow:    '0 1px 2px rgba(0,0,0,0.06),0 3px 10px rgba(0,0,0,0.07)',
  shadowMd:  '0 4px 16px rgba(0,0,0,0.1)',
  btnShadow: '0 4px 22px rgba(123,44,255,0.34)',

  isDark: false,
};

/** @deprecated Do not call — import DARK/LIGHT and read resolvedTheme from useTheme() */
export function useTokens() {
  throw new Error('Do not call useTokens() — import DARK/LIGHT and read resolvedTheme from useTheme()');
}
