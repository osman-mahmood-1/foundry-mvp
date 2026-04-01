/**
 * styles/tokens/colours.ts
 *
 * Single source of truth for all colours.
 * Palette: ice blue / electric cyan on deep slate.
 *
 * Rules (from fintech-ui SKILL.md):
 * - Primary accent is #00C2FF (electric cyan). Never iOS blue.
 * - No purple anywhere.
 * - Green is semantic-only: positive deltas, active/online status, credit lines.
 * - Exactly 4 text levels per theme.
 */

// ─── Light theme ──────────────────────────────────────────────────────────────

export const light = {
  // ── Page surfaces
  pageBg:             '#F4F6FA',
  sidebarBg:          '#FFFFFF',
  panelBg:            'rgba(255,255,255,0.82)',
  panelBgSolid:       '#FFFFFF',
  inputBg:            '#FFFFFF',
  hoverBg:            'rgba(0,0,0,0.032)',   // ghost — barely perceptible

  // ── Primary accent — electric cyan
  accent:             '#00C2FF',
  accentHover:        '#00AADD',
  accentLight:        'rgba(0,194,255,0.10)',
  accentSoft:         'rgba(0,194,255,0.06)',
  accentBorder:       'rgba(0,194,255,0.40)',
  accentDark:         '#0090C4',
  accentText:         '#00C2FF',

  // ── Text — 4 levels
  textPrimary:        '#0D1117',
  textSecondary:      '#4A5568',
  textMuted:          '#94A3B8',
  textInverse:        '#EDF2F7',
  textAccent:         '#00C2FF',

  // ── Borders
  borderHairline:     'rgba(0,0,0,0.07)',
  borderLight:        'rgba(0,0,0,0.06)',
  borderMedium:       'rgba(0,0,0,0.10)',
  borderInput:        'rgba(0,0,0,0.16)',

  // ── Nav
  navActive:          '#00C2FF',
  navActiveBg:        'rgba(0,194,255,0.08)',
  navInactive:        '#4A5568',
  navGroupLabel:      '#94A3B8',

  // ── Sidebar / misc
  sidebarShadow:      'rgba(0,0,0,0.06)',
  appleWhite:         '#FFFFFF',
  white:              '#FFFFFF',

  // ── Glass
  glassBg:            'rgba(255,255,255,0.82)',
  glassBlur:          'blur(18px) saturate(160%)',
  glassBorder:        'rgba(0,0,0,0.07)',
  glassShadow:        'rgba(0,0,0,0.06)',
  orbAccent:          'rgba(0,194,255,0.07)',
  orbSky:             'rgba(0,100,180,0.05)',

  // ── Backward-compat aliases
  blue:               '#00C2FF',
  blueLight:          'rgba(0,194,255,0.10)',
  blueDark:           '#0090C4',
  blueDeep:           '#006B99',
  tealBar:            '#10B981',

  // ── Semantic income / expense
  income:             '#10B981',
  incomeLight:        'rgba(16,185,129,0.10)',
  expense:            '#00C2FF',
  expenseLight:       'rgba(0,194,255,0.10)',

  // ── States
  warning:            '#F59E0B',
  warningLight:       'rgba(245,158,11,0.12)',
  warningDark:        '#D97706',
  danger:             '#F43F5E',
  dangerLight:        'rgba(244,63,94,0.12)',

  // ── Allowability
  allowable:          '#10B981',
  allowableLight:     'rgba(16,185,129,0.12)',
  notAllowable:       '#F43F5E',
  notAllowableLight:  'rgba(244,63,94,0.12)',
  pendingReview:      '#F59E0B',
  pendingReviewLight: 'rgba(245,158,11,0.12)',

  // ── Intelligence severity
  urgent:             '#F43F5E',
  urgentLight:        'rgba(244,63,94,0.12)',
  attention:          '#F59E0B',
  attentionLight:     'rgba(245,158,11,0.12)',
  info:               '#00C2FF',
  infoLight:          'rgba(0,194,255,0.10)',

  // ── Misc
  teal:               '#10B981',
  tealLight:          'rgba(16,185,129,0.10)',
  overview:           '#00C2FF',
  healthRing:         '#10B981',
  intelligence:       '#00C2FF',
  incomeGlow:         'rgba(16,185,129,0.06)',
  expenseGlow:        'rgba(0,194,255,0.06)',
  warningGlow:        'rgba(245,158,11,0.06)',
  dangerGlow:         'rgba(244,63,94,0.06)',
  intelligenceGlow:   'rgba(0,194,255,0.06)',
  expenseText:        '#00C2FF',
  incomeText:         '#10B981',
} as const

// ─── Dark theme ───────────────────────────────────────────────────────────────

export const dark = {
  // ── Page surfaces
  pageBg:             '#0D0F14',
  sidebarBg:          '#08090C',
  panelBg:            'rgba(19,22,29,0.80)',
  panelBgSolid:       '#13161D',
  inputBg:            '#1A1E28',
  hoverBg:            'rgba(255,255,255,0.028)',

  // ── Primary accent — electric cyan
  accent:             '#00C2FF',
  accentHover:        '#00AADD',
  accentLight:        'rgba(0,194,255,0.15)',
  accentSoft:         'rgba(0,194,255,0.08)',
  accentBorder:       'rgba(0,194,255,0.30)',
  accentDark:         '#0090C4',
  accentText:         '#00C2FF',

  // ── Text — 4 levels
  textPrimary:        '#EDF2F7',
  textSecondary:      '#8896AA',
  textMuted:          '#4A5568',
  textInverse:        '#0D1117',
  textAccent:         '#00C2FF',

  // ── Borders
  borderHairline:     'rgba(255,255,255,0.07)',
  borderLight:        'rgba(255,255,255,0.05)',
  borderMedium:       'rgba(255,255,255,0.09)',
  borderInput:        'rgba(255,255,255,0.15)',

  // ── Nav
  navActive:          '#EDF2F7',
  navActiveBg:        '#1F2330',
  navInactive:        '#8896AA',
  navGroupLabel:      '#4A5568',

  // ── Sidebar / misc
  sidebarShadow:      '1px 0 0 rgba(255,255,255,0.04)',
  appleWhite:         '#FFFFFF',
  white:              '#FFFFFF',

  // ── Glass
  glassBg:            'rgba(19,22,29,0.80)',
  glassBlur:          'blur(18px) saturate(160%)',
  glassBorder:        'rgba(255,255,255,0.07)',
  glassShadow:        'rgba(0,0,0,0.40)',
  orbAccent:          'rgba(0,194,255,0.14)',
  orbSky:             'rgba(0,194,255,0.07)',

  // ── Backward-compat aliases
  blue:               '#00C2FF',
  blueLight:          'rgba(0,194,255,0.15)',
  blueDark:           '#0090C4',
  blueDeep:           '#006B99',
  tealBar:            '#34D399',

  // ── Semantic income / expense
  income:             '#34D399',
  incomeLight:        'rgba(52,211,153,0.15)',
  expense:            '#33CEFF',
  expenseLight:       'rgba(0,194,255,0.15)',

  // ── States
  warning:            '#FBBD24',
  warningLight:       'rgba(251,189,36,0.15)',
  warningDark:        '#F59E0B',
  danger:             '#F87171',
  dangerLight:        'rgba(248,113,113,0.15)',

  // ── Allowability
  allowable:          '#34D399',
  allowableLight:     'rgba(52,211,153,0.15)',
  notAllowable:       '#F87171',
  notAllowableLight:  'rgba(248,113,113,0.15)',
  pendingReview:      '#FBBD24',
  pendingReviewLight: 'rgba(251,189,36,0.15)',

  // ── Intelligence severity
  urgent:             '#F87171',
  urgentLight:        'rgba(248,113,113,0.15)',
  attention:          '#FBBD24',
  attentionLight:     'rgba(251,189,36,0.15)',
  info:               '#00C2FF',
  infoLight:          'rgba(0,194,255,0.15)',

  // ── Misc
  teal:               '#34D399',
  tealLight:          'rgba(52,211,153,0.15)',
  overview:           '#00C2FF',
  healthRing:         '#30D158',
  intelligence:       '#00C2FF',
  incomeGlow:         'rgba(52,211,153,0.15)',
  expenseGlow:        'rgba(0,194,255,0.15)',
  warningGlow:        'rgba(245,158,11,0.15)',
  dangerGlow:         'rgba(244,63,94,0.15)',
  intelligenceGlow:   'rgba(0,194,255,0.20)',
  expenseText:        '#33CEFF',
  incomeText:         '#34D399',
} as const

// ─── Gradients ────────────────────────────────────────────────────────────────

export const gradients = {
  accent:       'linear-gradient(135deg, #00C2FF 0%, #0094CC 100%)',
  accentHover:  'linear-gradient(135deg, #1ACEFF 0%, #00AADD 100%)',
  accentDark:   'linear-gradient(135deg, #00C2FF 0%, #33CEFF 100%)',
  accentSoft:   'linear-gradient(135deg, rgba(0,194,255,0.12) 0%, rgba(0,148,204,0.12) 100%)',
  accentText:   'linear-gradient(135deg, #00C2FF 0%, #33CEFF 100%)',
  income:       'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.22) 0%, transparent 70%)',
  expense:      'radial-gradient(ellipse at 80% 50%, rgba(0,194,255,0.22) 0%, transparent 70%)',
  intelligence: 'radial-gradient(ellipse at 50% 0%, rgba(0,194,255,0.28) 0%, rgba(0,148,204,0.18) 50%, transparent 80%)',
  warning:      'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.22) 0%, transparent 70%)',
  danger:       'radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.22) 0%, transparent 70%)',
  overview:     'radial-gradient(ellipse at 50% 0%, rgba(0,194,255,0.18) 0%, rgba(16,185,129,0.10) 60%, transparent 90%)',
  orbAccent:    'radial-gradient(circle, rgba(0,194,255,0.08) 0%, transparent 70%)',
  orbSky:       'radial-gradient(circle, rgba(0,194,255,0.05) 0%, transparent 70%)',
  incomeText:   'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  expenseText:  'linear-gradient(135deg, #00C2FF 0%, #33CEFF 100%)',
  healthRing:   'linear-gradient(135deg, #00C2FF 0%, #10B981 100%)',
  tealBar:      'linear-gradient(90deg, #10B981, #34D399)',
} as const

export const semantic = {
  income:             '#10B981',
  incomeLight:        'rgba(16,185,129,0.12)',
  expense:            '#00C2FF',
  expenseLight:       'rgba(0,194,255,0.12)',
  warning:            '#F59E0B',
  warningLight:       'rgba(245,158,11,0.12)',
  warningDark:        '#D97706',
  danger:             '#F43F5E',
  dangerLight:        'rgba(244,63,94,0.12)',
  allowable:          '#10B981',
  allowableLight:     'rgba(16,185,129,0.12)',
  notAllowable:       '#F43F5E',
  notAllowableLight:  'rgba(244,63,94,0.12)',
  pendingReview:      '#F59E0B',
  pendingReviewLight: 'rgba(245,158,11,0.12)',
  urgent:             '#F43F5E',
  urgentLight:        'rgba(244,63,94,0.12)',
  attention:          '#F59E0B',
  attentionLight:     'rgba(245,158,11,0.12)',
  info:               '#00C2FF',
  infoLight:          'rgba(0,194,255,0.12)',
  teal:               '#10B981',
  tealLight:          'rgba(16,185,129,0.12)',
} as const

export const colours = light

export type ColourMode  = 'light' | 'dark'
export type ColourToken = keyof typeof light
