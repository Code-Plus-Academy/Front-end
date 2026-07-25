// frontend/src/styles/tokens.js
// Single source of design tokens for all CPA pages.
// Derived from CPASettingsSystem.jsx THEMES (authoritative brand reference).

export const DARK = {
  // Backgrounds
  bg:          '#0F172A',
  bg2:         '#111827',
  bg3:         '#1E293B',
  surf:        '#1E293B',
  card:        '#1E293B',
  cardHover:   '#334155',
  cardSolid:   '#1E293B',
  cardBorder:  'rgba(255, 255, 255, 0.08)',
  sep:         'rgba(255, 255, 255, 0.08)',
  glass:       'rgba(15, 23, 42, 0.95)',
  inputBg:     'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  sidebarBg:   '#111827',

  // Brand
  accent:      '#3B7CFF',
  accent2:     '#34C77B',
  accentSoft:  'rgba(59, 124, 255, 0.15)',
  accentGlow:  'rgba(59, 124, 255, 0.35)',
  neon:        '#3B7CFF',
  neon2:       '#34C77B',
  neonCyan:    '#00e5ff',
  border:      'rgba(255, 255, 255, 0.08)',
  borderFocus: 'rgba(59, 124, 255, 0.45)',

  // Typography
  txt:   '#F8FAFC',
  txt2:  '#D1D5DB',
  txt3:  '#9CA3AF',
  text:  '#F8FAFC',
  text2: '#D1D5DB',
  text3: '#9CA3AF',

  // Semantic
  purple:     '#9333EA',
  purpleDim:  'rgba(147, 51, 234, 0.15)',
  blue:       '#3B7CFF',
  blueDim:    'rgba(59, 124, 255, 0.15)',
  cyan:       '#00C9B1',
  cyanDim:    'rgba(0, 201, 177, 0.1)',
  gold:       '#F59E0B',
  goldDim:    'rgba(245, 158, 11, 0.1)',
  red:        '#EF4444',
  redDim:     'rgba(239, 68, 68, 0.15)',
  green:      '#34C77B',
  greenDim:   'rgba(52, 199, 123, 0.15)',
  danger:     '#EF4444',  dangerSoft:  'rgba(239, 68, 68, 0.15)',
  success:    '#10B981',  successSoft: 'rgba(16, 185, 129, 0.15)',
  warning:    '#F59E0B',  warningSoft: 'rgba(245, 158, 11, 0.15)',
  badgeBg:    'rgba(59, 124, 255, 0.18)',
  badgeText:  '#3B7CFF',

  // Shadows
  shadow:    '0 4px 24px rgba(0, 0, 0, 0.4)',
  shadowSm:  '0 2px 12px rgba(0, 0, 0, 0.3)',
  btnShadow: '0 0 25px rgba(59, 124, 255, 0.35)',

  headerBg:  'rgba(15, 23, 42, 0.95)',
  isDark: true,
};

export const LIGHT = {
  bg:          '#FFFFFF',
  bg2:         '#F8FAFC',
  bg3:         '#FFFFFF',
  surf:        '#FFFFFF',
  card:        '#FFFFFF',
  cardHover:   '#F8FAFC',
  cardSolid:   '#FFFFFF',
  cardBorder:  '#E5E7EB',
  sep:         '#E5E7EB',
  glass:       'rgba(255, 255, 255, 0.95)',
  inputBg:     '#F8FAFC',
  inputBorder: '#E5E7EB',
  sidebarBg:   '#F8FAFC',

  accent:      '#2563EB',
  accent2:     '#059669',
  accentSoft:  'rgba(37, 99, 235, 0.08)',
  accentGlow:  'rgba(37, 99, 235, 0.18)',
  neon:        '#2563EB',
  neon2:       '#059669',
  neonCyan:    '#0284c7',
  border:      '#E5E7EB',
  borderFocus: 'rgba(37, 99, 235, 0.4)',

  txt:   '#111827',
  txt2:  '#4B5563',
  txt3:  '#6B7280',
  text:  '#111827',
  text2: '#4B5563',
  text3: '#6B7280',

  purple:     '#7C3AED',
  purpleDim:  'rgba(124, 58, 237, 0.08)',
  blue:       '#2563EB',
  blueDim:    'rgba(37, 99, 235, 0.08)',
  cyan:       '#0284C7',
  cyanDim:    'rgba(2, 132, 199, 0.08)',
  gold:       '#D97706',
  goldDim:    'rgba(217, 119, 6, 0.08)',
  red:        '#DC2626',
  redDim:     'rgba(220, 38, 38, 0.08)',
  green:      '#059669',
  greenDim:   'rgba(5, 150, 105, 0.08)',
  danger:     '#DC2626',  dangerSoft:  'rgba(220, 38, 38, 0.08)',
  success:    '#059669',  successSoft: 'rgba(5, 150, 105, 0.08)',
  warning:    '#D97706',  warningSoft: 'rgba(217, 119, 6, 0.08)',
  badgeBg:    'rgba(37, 99, 235, 0.08)',
  badgeText:  '#2563EB',

  shadow:    '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  shadowSm:  '0 1px 2px rgba(0, 0, 0, 0.05)',
  btnShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',

  headerBg:  'rgba(255, 255, 255, 0.95)',
  isDark: false,
};

/** @deprecated Do not call — import DARK/LIGHT and read resolvedTheme from useTheme() */
export function useTokens() {
  throw new Error('Do not call useTokens() — import DARK/LIGHT and read resolvedTheme from useTheme()');
}
