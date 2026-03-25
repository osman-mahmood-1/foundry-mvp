/**
 * styles/tokens/colours.ts
 *
 * All colour values in Foundry. Two layers:
 *
 * 1. Raw palette  — the actual hex values. Nothing references these directly
 *                   outside this file.
 * 2. Semantic     — named by purpose, not appearance. Components use these.
 *
 * To re-skin the entire product: change the semantic aliases below.
 * To change a specific colour: change the raw palette value.
 */

// ─── Raw palette ──────────────────────────────────────────────────────────────

const palette = {
  navy:        '#051C2C',
  navyLight:   '#0D2035',
  navyBorder:  '#1B3A52',
  teal:        '#00D4AA',
  tealLight:   '#00F5C4',
  tealDark:    '#00856A',
  blue:        '#2563EB',
  blueLight:   'rgba(37,99,235,0.07)',
  amber:       '#D97706',
  amberLight:  'rgba(245,158,11,0.08)',
  amberDark:   '#92400E',
  red:         '#DC2626',
  redLight:    'rgba(239,68,68,0.08)',
  green:       '#00856A',
  greenLight:  'rgba(0,212,170,0.08)',
  slate400:    '#94A3B8',
  slate500:    '#64748B',
  slate600:    '#475569',
  white:       '#ffffff',
  offWhite:    '#F0F4FA',
} as const

// ─── Semantic colours — use these in components ───────────────────────────────

export const colours = {
  // Brand
  brand:         palette.navy,
  brandLight:    palette.navyLight,
  accent:        palette.teal,
  accentLight:   palette.tealLight,
  accentDark:    palette.tealDark,

  // Backgrounds
  pageBg:        palette.offWhite,
  inputBg:       'rgba(255,255,255,0.8)',

  // Text
  textPrimary:   palette.navy,
  textSecondary: palette.slate600,
  textMuted:     palette.slate400,
  textInverse:   palette.white,

  // Borders
  borderSubtle:  'rgba(5,28,44,0.06)',
  borderLight:   'rgba(5,28,44,0.10)',
  borderMedium:  'rgba(5,28,44,0.12)',

  // Status — income
  income:        palette.green,
  incomeLight:   palette.greenLight,

  // Status — expenses
  expense:       palette.blue,
  expenseLight:  palette.blueLight,

  // Status — warnings
  warning:       palette.amber,
  warningLight:  palette.amberLight,
  warningDark:   palette.amberDark,

  // Status — errors / urgent
  danger:        palette.red,
  dangerLight:   palette.redLight,

  // Status — allowability badges
  allowable:     palette.tealDark,
  allowableLight: palette.greenLight,
  notAllowable:  palette.red,
  notAllowableLight: palette.redLight,
  pendingReview: palette.amber,
  pendingReviewLight: palette.amberLight,

  // Intelligence card severity
  urgent:        palette.red,
  urgentLight:   palette.redLight,
  attention:     palette.amber,
  attentionLight: palette.amberLight,
  info:          palette.tealDark,
  infoLight:     palette.greenLight,

  // Nav
  navActive:     palette.navy,
  navInactive:   palette.slate600,
} as const

export type ColourToken = keyof typeof colours
