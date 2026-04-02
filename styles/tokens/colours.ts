/**
 * styles/tokens/colours.ts
 *
 * Single source of truth for all colours.
 * Palette: sapphire / teal / copper on deep navy-black (dark) or warm white (light).
 *
 * Rules:
 * - Primary interactive accent is sapphire (#3b82f6 dark / #1d4ed8 light).
 * - CTA (one per screen) is copper gradient (#e8922a → #d4731a).
 * - Active nav item is the same copper gradient.
 * - Sidebar and topbar backgrounds are always transparent with no backdrop-filter.
 * - Four text levels per theme: textPrimary, textSecondary, textMuted, (textInverse).
 */

// ─── Dark theme ───────────────────────────────────────────────────────────────

export const dark = {
  // ── Page surfaces
  pageBg:          'radial-gradient(ellipse 110% 90% at 100% 0%, #0c1826 0%, #050810 55%, #000000 100%)',
  bg5:             '#0f1a2e',              // inactive bar/chart elements
  sidebarBg:       'transparent',          // sidebar is always transparent

  // ── Inner container (glass panel that wraps the main content area)
  panelBg:         'rgba(8,12,22,0.65)',   // inner container glass
  panelBgSolid:    'rgba(4,6,12,0.99)',    // slide-in panel / modal solid bg
  innerBorderTop:  'rgba(255,255,255,0.14)', // top highlight on inner container

  // ── Cards
  cardBg:          'rgba(0,0,0,0.75)',
  cardBorder:      'rgba(255,255,255,0.06)',
  cardBorderTop:   'rgba(255,255,255,0.07)',

  // ── Input / form fields
  inputBg:         'rgba(255,255,255,0.06)',
  inputBorder:     'rgba(255,255,255,0.12)',
  inputFocusBg:    'rgba(59,130,246,0.10)',
  inputFocusBorder:'rgba(59,130,246,0.30)',
  inputFocusGlow:  '0 0 0 3px rgba(59,130,246,0.18)',

  // ── Text — 4 levels (boosted one step for contrast)
  textPrimary:     '#ffffff',
  textSecondary:   'rgba(255,255,255,0.85)',
  textMuted:       'rgba(255,255,255,0.55)',
  textInverse:     '#000000',

  // ── Primary interactive — sapphire
  accent:          '#3b82f6',
  accentHover:     '#60a5fa',
  accentDark:      '#2563eb',
  accentLight:     'rgba(59,130,246,0.14)',
  accentSoft:      'rgba(59,130,246,0.08)',
  accentBorder:    'rgba(59,130,246,0.30)',
  accentText:      '#3b82f6',

  // ── CTA — pure sapphire gradient (one primary action per screen)
  cta:             'linear-gradient(150deg, #0a1440 0%, #122060 28%, #1a30a0 58%, #1e48c8 100%)',
  ctaGlow:         'rgba(30,72,200,0.40)',
  ctaText:         'rgba(255,255,255,0.93)',

  // ── Teal / extra palette
  orange:          '#14b8a6',   // teal — replaces copper as CTA secondary alias
  teal:            '#14b8a6',   // teal 500
  tealLight:       'rgba(20,184,166,0.14)',
  tealBar:         '#2dd4bf',   // teal 400
  purple:          '#a78bfa',
  purple2:         '#c4b5fd',
  green:           '#22d3a5',   // positive teal-green
  blue:            '#3b82f6',   // sapphire alias
  blueLight:       'rgba(59,130,246,0.14)',
  blueDark:        '#2563eb',
  blueDeep:        '#1d4ed8',

  // ── Borders
  borderHairline:  'rgba(255,255,255,0.08)',
  borderLight:     'rgba(255,255,255,0.05)',
  borderMedium:    'rgba(255,255,255,0.14)',
  borderInput:     'rgba(255,255,255,0.12)',

  // ── Table
  tableHover:      'rgba(59,130,246,0.06)',

  // ── Nav
  hoverBg:         'rgba(255,255,255,0.05)',
  navActive:       '#ffffff',                                    // text on sapphire/teal gradient
  navActiveBg:     'linear-gradient(150deg, #1a30a0, #1e48c8)', // sapphire gradient (matches CTA)
  navActiveShadow: '0 4px 20px rgba(59,130,246,0.30)',
  navInactive:     'rgba(255,255,255,0.55)',
  navGroupLabel:   'rgba(255,255,255,0.28)',

  // ── Topbar action items
  topbarItemBg:     'rgba(255,255,255,0.06)',
  topbarItemBorder: 'rgba(255,255,255,0.10)',

  // ── Secondary / ghost button
  simpleBg:        'rgba(255,255,255,0.06)',
  simpleBorder:    'rgba(255,255,255,0.09)',

  // ── Scrollbar
  scrollThumb:     '#0f1a2e',

  // ── Shadows
  shadow:          '0 8px 32px rgba(0,0,0,0.50)',
  innerShadow:     'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.06), 0 28px 72px rgba(0,0,0,0.80)',
  cardShadow:      'inset 0 1px 0 rgba(255,255,255,0.07)',

  // ── Glass (mirrors glass utility — kept for direct token access)
  glassBg:         'rgba(8,12,22,0.65)',
  glassBlur:       'blur(40px) saturate(140%) brightness(1.03)',
  glassBorder:     'rgba(255,255,255,0.08)',
  glassShadow:     'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.06), 0 28px 72px rgba(0,0,0,0.80)',

  // ── Semantic — income / expense
  income:          '#22d3a5',
  incomeLight:     'rgba(34,211,165,0.14)',
  incomeText:      '#22d3a5',
  incomeGlow:      'rgba(34,211,165,0.14)',
  expense:         '#f87171',
  expenseLight:    'rgba(248,113,113,0.14)',
  expenseText:     '#f87171',
  expenseGlow:     'rgba(248,113,113,0.14)',

  // ── States
  warning:         '#fbbf24',
  warningLight:    'rgba(251,191,36,0.14)',
  warningDark:     '#f59e0b',
  warningGlow:     'rgba(251,191,36,0.14)',
  danger:          '#f87171',
  dangerLight:     'rgba(248,113,113,0.14)',
  dangerGlow:      'rgba(248,113,113,0.14)',

  // ── Allowability
  allowable:          '#22d3a5',
  allowableLight:     'rgba(34,211,165,0.14)',
  notAllowable:       '#f87171',
  notAllowableLight:  'rgba(248,113,113,0.14)',
  pendingReview:      '#fbbf24',
  pendingReviewLight: 'rgba(251,191,36,0.14)',

  // ── Intelligence severity
  urgent:           '#f87171',
  urgentLight:      'rgba(248,113,113,0.14)',
  attention:        '#fbbf24',
  attentionLight:   'rgba(251,191,36,0.14)',
  info:             '#60a5fa',
  infoLight:        'rgba(96,165,250,0.12)',

  // ── Misc / backward-compat aliases
  overview:         '#3b82f6',
  healthRing:       '#22d3a5',
  intelligence:     '#a78bfa',
  intelligenceGlow: 'rgba(167,139,250,0.14)',
  appleWhite:       '#ffffff',
  white:            '#ffffff',
  panelBorder:      'rgba(255,255,255,0.08)',
  orbAccent:        'rgba(59,130,246,0.38)',
  orbSky:           'rgba(45,212,191,0.12)',
  sidebarShadow:    'none',
} as const

// ─── Light theme ──────────────────────────────────────────────────────────────

export const light = {
  // ── Page surfaces
  pageBg:          'radial-gradient(ellipse 110% 90% at 100% 0%, #fdf5ec 0%, #faf7f3 50%, #ffffff 100%)',
  bg5:             '#e8edf5',
  sidebarBg:       'transparent',

  // ── Inner container
  panelBg:         'rgba(255,255,255,0.72)',
  panelBgSolid:    'rgba(255,254,252,0.99)',
  innerBorderTop:  'rgba(255,255,255,0.98)',

  // ── Cards
  cardBg:          'rgba(255,255,255,0.78)',
  cardBorder:      'rgba(15,23,42,0.07)',
  cardBorderTop:   'rgba(255,255,255,0.95)',

  // ── Input / form fields
  inputBg:         'rgba(15,22,38,0.04)',
  inputBorder:     'rgba(15,23,42,0.14)',
  inputFocusBg:    'rgba(29,78,216,0.06)',
  inputFocusBorder:'rgba(29,78,216,0.22)',
  inputFocusGlow:  '0 0 0 3px rgba(29,78,216,0.12)',

  // ── Text — 4 levels (boosted one step for contrast)
  textPrimary:     '#050a12',
  textSecondary:   '#0f1e2d',
  textMuted:       '#2d4257',
  textInverse:     '#ffffff',

  // ── Primary interactive — deep sapphire for legibility on white
  accent:          '#1d4ed8',
  accentHover:     '#2563eb',
  accentDark:      '#1e40af',
  accentLight:     'rgba(29,78,216,0.08)',
  accentSoft:      'rgba(29,78,216,0.05)',
  accentBorder:    'rgba(29,78,216,0.18)',
  accentText:      '#1d4ed8',

  // ── CTA — deep navy gradient
  cta:             'linear-gradient(150deg, #1a3fa0 0%, #2255cc 50%, #2d6ae0 100%)',
  ctaGlow:         'rgba(34,85,204,0.35)',
  ctaText:         '#ffffff',

  // ── Teal / extra palette
  orange:          '#0d9488',   // teal — replaces copper
  teal:            '#0d9488',
  tealLight:       'rgba(13,148,136,0.12)',
  tealBar:         '#14b8a6',
  purple:          '#7c3aed',
  purple2:         '#8b5cf6',
  green:           '#0a8060',
  blue:            '#1d4ed8',
  blueLight:       'rgba(29,78,216,0.08)',
  blueDark:        '#1e40af',
  blueDeep:        '#1e3a8a',

  // ── Borders
  borderHairline:  'rgba(15,23,42,0.08)',
  borderLight:     'rgba(15,23,42,0.06)',
  borderMedium:    'rgba(15,23,42,0.14)',
  borderInput:     'rgba(15,23,42,0.14)',

  // ── Table
  tableHover:      'rgba(29,78,216,0.04)',

  // ── Nav
  hoverBg:         'rgba(15,23,42,0.04)',
  navActive:       '#ffffff',
  navActiveBg:     'linear-gradient(150deg, #1a3fa0, #2d6ae0)',
  navActiveShadow: '0 4px 20px rgba(37,99,235,0.22)',
  navInactive:     '#2d4257',
  navGroupLabel:   '#4a5f78',

  // ── Topbar action items — solid bg (no backdrop-filter in light to avoid seam)
  topbarItemBg:     'rgba(255,255,255,0.85)',
  topbarItemBorder: 'rgba(15,23,42,0.10)',

  // ── Secondary / ghost button
  simpleBg:        'rgba(255,255,255,0.80)',
  simpleBorder:    'rgba(15,23,42,0.09)',

  // ── Scrollbar
  scrollThumb:     '#c5cfe0',

  // ── Shadows
  shadow:          '0 4px 18px rgba(15,23,42,0.10)',
  innerShadow:     'inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 1px rgba(15,23,42,0.07)',
  cardShadow:      '0 2px 16px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',

  // ── Glass
  glassBg:         'rgba(255,255,255,0.72)',
  glassBlur:       'blur(40px) saturate(140%) brightness(1.03)',
  glassBorder:     'rgba(15,23,42,0.08)',
  glassShadow:     'inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 1px rgba(15,23,42,0.07)',

  // ── Semantic — income / expense
  income:          '#0a8060',
  incomeLight:     'rgba(10,128,96,0.10)',
  incomeText:      '#0a8060',
  incomeGlow:      'rgba(10,128,96,0.10)',
  expense:         '#c0392b',
  expenseLight:    'rgba(192,57,43,0.09)',
  expenseText:     '#c0392b',
  expenseGlow:     'rgba(192,57,43,0.09)',

  // ── States
  warning:         '#a0720e',
  warningLight:    'rgba(160,114,14,0.10)',
  warningDark:     '#7c5509',
  warningGlow:     'rgba(160,114,14,0.10)',
  danger:          '#c0392b',
  dangerLight:     'rgba(192,57,43,0.09)',
  dangerGlow:      'rgba(192,57,43,0.09)',

  // ── Allowability
  allowable:          '#0a8060',
  allowableLight:     'rgba(10,128,96,0.10)',
  notAllowable:       '#c0392b',
  notAllowableLight:  'rgba(192,57,43,0.09)',
  pendingReview:      '#a0720e',
  pendingReviewLight: 'rgba(160,114,14,0.10)',

  // ── Intelligence severity
  urgent:           '#c0392b',
  urgentLight:      'rgba(192,57,43,0.09)',
  attention:        '#a0720e',
  attentionLight:   'rgba(160,114,14,0.10)',
  info:             '#1d4ed8',
  infoLight:        'rgba(29,78,216,0.08)',

  // ── Misc / backward-compat aliases
  overview:         '#1d4ed8',
  healthRing:       '#0a8060',
  intelligence:     '#7c3aed',
  intelligenceGlow: 'rgba(124,58,237,0.10)',
  appleWhite:       '#ffffff',
  white:            '#ffffff',
  panelBorder:      'rgba(15,23,42,0.08)',
  orbAccent:        'rgba(37,99,235,0.32)',
  orbSky:           'rgba(37,99,235,0.08)',
  sidebarShadow:    'none',
} as const

// ─── Gradients ────────────────────────────────────────────────────────────────

export const gradients = {
  accent:       'linear-gradient(135deg, #e8922a 0%, #d4731a 100%)',     // copper CTA
  accentHover:  'linear-gradient(135deg, #f0a040 0%, #e8922a 100%)',
  income:       'radial-gradient(ellipse at 20% 50%, rgba(34,211,165,0.22) 0%, transparent 70%)',
  expense:      'radial-gradient(ellipse at 80% 50%, rgba(248,113,113,0.22) 0%, transparent 70%)',
  intelligence: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.28) 0%, rgba(124,58,237,0.18) 50%, transparent 80%)',
  warning:      'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.22) 0%, transparent 70%)',
  danger:       'radial-gradient(ellipse at 50% 0%, rgba(248,113,113,0.22) 0%, transparent 70%)',
  overview:     'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.18) 0%, rgba(34,211,165,0.10) 60%, transparent 90%)',
  orbAmbient:   'radial-gradient(circle, rgba(59,130,246,0.38) 0%, rgba(45,212,191,0.12) 30%, rgba(45,212,191,0.04) 55%, transparent 72%)',
  incomeText:   'linear-gradient(135deg, #22d3a5 0%, #0d9488 100%)',
  expenseText:  'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
  healthRing:   'linear-gradient(135deg, #3b82f6 0%, #22d3a5 100%)',
} as const

export const semantic = {
  income:             '#22d3a5',
  incomeLight:        'rgba(34,211,165,0.14)',
  expense:            '#f87171',
  expenseLight:       'rgba(248,113,113,0.14)',
  warning:            '#fbbf24',
  warningLight:       'rgba(251,191,36,0.14)',
  warningDark:        '#f59e0b',
  danger:             '#f87171',
  dangerLight:        'rgba(248,113,113,0.14)',
  allowable:          '#22d3a5',
  allowableLight:     'rgba(34,211,165,0.14)',
  notAllowable:       '#f87171',
  notAllowableLight:  'rgba(248,113,113,0.14)',
  pendingReview:      '#fbbf24',
  pendingReviewLight: 'rgba(251,191,36,0.14)',
  urgent:             '#f87171',
  urgentLight:        'rgba(248,113,113,0.14)',
  attention:          '#fbbf24',
  attentionLight:     'rgba(251,191,36,0.14)',
  info:               '#60a5fa',
  infoLight:          'rgba(96,165,250,0.12)',
  teal:               '#22d3a5',
  tealLight:          'rgba(34,211,165,0.14)',
} as const

export const colours = light

export type ColourMode  = 'light' | 'dark'
export type ColourToken = keyof typeof light
