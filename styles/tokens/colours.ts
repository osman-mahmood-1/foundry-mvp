/**
 * styles/tokens/colours.ts
 *
 * Single source of truth for all colours.
 * Palette: warm gold / orange on deep warm-dark (dark) or parchment (light).
 *
 * Authority: lotech-dashboard-v9.html mockup — no other source.
 *
 * Rules:
 * - Primary accent is gold (#f5a623). Secondary is orange (#f97316).
 * - Three text levels per theme: textPrimary, textSecondary, textMuted.
 * - Sidebar background is always transparent.
 * - Active nav item: gold-to-orange gradient bg, black text (dark) / white text (light).
 */

// ─── Dark theme ───────────────────────────────────────────────────────────────
// Source: [data-theme="dark"] in mockup

export const dark = {
  // ── Page surfaces
  pageBg:          '#0a0806',              // --outer-bg
  bg5:             '#252018',              // --bg5 (inactive bar/chart elements)
  sidebarBg:       'transparent',          // sidebar is always transparent

  // ── Inner container (glass panel that wraps the main content area)
  panelBg:         'rgba(13,10,7,0.72)',   // --inner-bg
  panelBgSolid:    'rgba(11,9,6,0.99)',    // --panel-bg (slide-in panel)
  innerBorderTop:  'rgba(255,255,255,0.16)', // top highlight on inner container

  // ── Cards (slightly less opaque so layers show through)
  cardBg:          'rgba(20,16,11,0.60)',  // --card-bg
  cardBorder:      'rgba(255,255,255,0.09)', // --card-border
  cardBorderTop:   'rgba(255,255,255,0.12)', // card top highlight

  // ── Input / form fields
  inputBg:         'rgba(255,255,255,0.06)',  // --input-bg
  inputBorder:     'rgba(255,255,255,0.12)',  // --input-border

  // ── Text — 3 levels (--text, --text2, --text3)
  textPrimary:     '#f2ece3',   // --text
  textSecondary:   '#9a9080',   // --text2
  textMuted:       '#4a4438',   // --text3
  textInverse:     '#0a0806',   // text on bright backgrounds

  // ── Accent palette
  accent:          '#f5a623',   // --gold (primary)
  accentHover:     '#fbbf24',   // --gold2 (hover state)
  accentDark:      '#d4820f',   // darker gold for text on light
  accentLight:     'rgba(245,166,35,0.14)',
  accentSoft:      'rgba(245,166,35,0.08)',
  accentBorder:    'rgba(245,166,35,0.40)',
  accentText:      '#f5a623',
  orange:          '#f97316',   // --orange
  purple:          '#8b5cf6',   // --purple
  purple2:         '#a78bfa',   // --purple2
  green:           '#22c55e',   // --green
  blue:            '#3b82f6',   // --blue
  blueLight:       'rgba(59,130,246,0.15)',
  blueDark:        '#2563eb',
  blueDeep:        '#1d4ed8',

  // ── Borders
  borderHairline:  'rgba(255,255,255,0.08)',  // --border
  borderLight:     'rgba(255,255,255,0.05)',
  borderMedium:    'rgba(255,255,255,0.14)',  // --border2
  borderInput:     'rgba(255,255,255,0.12)',  // --input-border (alias)

  // ── Nav
  hoverBg:         'rgba(255,255,255,0.05)',  // --nav-hover
  navActive:       '#000000',                  // active item text (on gold gradient)
  navActiveBg:     'linear-gradient(135deg, #f5a623, #f97316)', // gold gradient
  navActiveShadow: '0 4px 20px rgba(245,166,35,0.35)',
  navInactive:     '#9a9080',   // --text2
  navGroupLabel:   '#4a4438',   // --text3

  // ── Topbar action items (search, icon buttons)
  topbarItemBg:     'rgba(255,255,255,0.06)',   // --topbar-item-bg
  topbarItemBorder: 'rgba(255,255,255,0.10)',   // --topbar-item-border

  // ── Secondary / ghost button (btn-simple in mockup)
  simpleBg:        'rgba(255,255,255,0.06)',    // --simple-bg
  simpleBorder:    'rgba(255,255,255,0.11)',    // --simple-border

  // ── Scrollbar
  scrollThumb:     '#1c1915',   // --scroll

  // ── Shadows
  shadow:          '0 8px 32px rgba(0,0,0,0.4)',
  innerShadow:     '0 2px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.65)',
  cardShadow:      '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',

  // ── Glass
  glassBg:         'rgba(13,10,7,0.72)',
  glassBlur:       'blur(40px) saturate(150%) brightness(1.06)',
  glassBorder:     'rgba(255,255,255,0.11)',
  glassShadow:     '0 2px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.65)',

  // ── Semantic — income / expense
  income:          '#22c55e',
  incomeLight:     'rgba(34,197,94,0.14)',
  incomeText:      '#22c55e',
  incomeGlow:      'rgba(34,197,94,0.14)',
  expense:         '#f97316',
  expenseLight:    'rgba(249,115,22,0.14)',
  expenseText:     '#f97316',
  expenseGlow:     'rgba(249,115,22,0.14)',

  // ── States
  warning:         '#f5a623',
  warningLight:    'rgba(245,166,35,0.14)',
  warningDark:     '#d4820f',
  warningGlow:     'rgba(245,166,35,0.14)',
  danger:          '#ef4444',
  dangerLight:     'rgba(239,68,68,0.14)',
  dangerGlow:      'rgba(239,68,68,0.14)',

  // ── Allowability
  allowable:          '#22c55e',
  allowableLight:     'rgba(34,197,94,0.14)',
  notAllowable:       '#ef4444',
  notAllowableLight:  'rgba(239,68,68,0.14)',
  pendingReview:      '#f5a623',
  pendingReviewLight: 'rgba(245,166,35,0.14)',

  // ── Intelligence severity
  urgent:           '#ef4444',
  urgentLight:      'rgba(239,68,68,0.14)',
  attention:        '#f5a623',
  attentionLight:   'rgba(245,166,35,0.14)',
  info:             '#3b82f6',
  infoLight:        'rgba(59,130,246,0.14)',

  // ── Misc / backward-compat aliases
  teal:             '#22c55e',
  tealLight:        'rgba(34,197,94,0.14)',
  tealBar:          '#22c55e',
  overview:         '#f5a623',
  healthRing:       '#22c55e',
  intelligence:     '#8b5cf6',
  intelligenceGlow: 'rgba(139,92,246,0.14)',
  appleWhite:       '#ffffff',
  white:            '#ffffff',
  panelBorder:      'rgba(255,255,255,0.11)',
  orbAccent:        'rgba(249,115,22,0.48)',
  orbSky:           'rgba(245,166,35,0.26)',
  sidebarShadow:    'none',
} as const

// ─── Light theme ──────────────────────────────────────────────────────────────
// Source: [data-theme="light"] in mockup

export const light = {
  // ── Page surfaces
  pageBg:          '#ddd8ce',               // --outer-bg
  bg5:             '#ccc4b6',               // --bg5
  sidebarBg:       'transparent',           // always transparent

  // ── Inner container
  panelBg:         'rgba(248,243,235,0.78)', // --inner-bg
  panelBgSolid:    'rgba(248,244,236,0.99)', // --panel-bg (slide-in panel)
  innerBorderTop:  'rgba(255,255,255,0.80)', // top highlight

  // ── Cards
  cardBg:          'rgba(255,252,246,0.65)', // --card-bg
  cardBorder:      'rgba(0,0,0,0.07)',        // --card-border
  cardBorderTop:   'rgba(255,255,255,0.70)',  // card top highlight

  // ── Input / form fields
  inputBg:         'rgba(0,0,0,0.05)',       // --input-bg
  inputBorder:     'rgba(0,0,0,0.12)',        // --input-border

  // ── Text — 3 levels
  textPrimary:     '#1a1612',   // --text
  textSecondary:   '#6b6050',   // --text2
  textMuted:       '#a09080',   // --text3
  textInverse:     '#ddd8ce',

  // ── Accent palette (same values across themes)
  accent:          '#f5a623',
  accentHover:     '#fbbf24',
  accentDark:      '#d4820f',
  accentLight:     'rgba(245,166,35,0.12)',
  accentSoft:      'rgba(245,166,35,0.06)',
  accentBorder:    'rgba(245,166,35,0.40)',
  accentText:      '#f5a623',
  orange:          '#f97316',
  purple:          '#8b5cf6',
  purple2:         '#a78bfa',
  green:           '#22c55e',
  blue:            '#3b82f6',
  blueLight:       'rgba(59,130,246,0.12)',
  blueDark:        '#2563eb',
  blueDeep:        '#1d4ed8',

  // ── Borders
  borderHairline:  'rgba(0,0,0,0.08)',    // --border
  borderLight:     'rgba(0,0,0,0.06)',
  borderMedium:    'rgba(0,0,0,0.14)',    // --border2
  borderInput:     'rgba(0,0,0,0.12)',    // alias

  // ── Nav
  hoverBg:         'rgba(0,0,0,0.04)',    // --nav-hover
  navActive:       '#ffffff',              // active text on gold gradient (light theme: white)
  navActiveBg:     'linear-gradient(135deg, #f5a623, #f97316)',
  navActiveShadow: '0 4px 20px rgba(245,166,35,0.35)',
  navInactive:     '#6b6050',   // --text2
  navGroupLabel:   '#a09080',   // --text3

  // ── Topbar action items
  topbarItemBg:     'rgba(255,255,255,0.55)',  // --topbar-item-bg
  topbarItemBorder: 'rgba(0,0,0,0.10)',         // --topbar-item-border

  // ── Secondary / ghost button
  simpleBg:        'rgba(0,0,0,0.05)',    // --simple-bg
  simpleBorder:    'rgba(0,0,0,0.13)',    // --simple-border

  // ── Scrollbar
  scrollThumb:     '#d9d1c5',   // --scroll

  // ── Shadows
  shadow:          '0 4px 18px rgba(160,120,60,0.10)',
  innerShadow:     '0 1px 0 rgba(255,255,255,0.5) inset, 0 0 0 1px rgba(0,0,0,0.06), 0 20px 60px rgba(100,70,20,0.20)',
  cardShadow:      '0 4px 18px rgba(160,120,60,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',

  // ── Glass
  glassBg:         'rgba(248,243,235,0.78)',
  glassBlur:       'blur(40px) saturate(150%) brightness(1.06)',
  glassBorder:     'rgba(0,0,0,0.09)',
  glassShadow:     '0 1px 0 rgba(255,255,255,0.5) inset, 0 0 0 1px rgba(0,0,0,0.06), 0 20px 60px rgba(100,70,20,0.20)',

  // ── Semantic
  income:          '#22c55e',
  incomeLight:     'rgba(34,197,94,0.12)',
  incomeText:      '#22c55e',
  incomeGlow:      'rgba(34,197,94,0.10)',
  expense:         '#f97316',
  expenseLight:    'rgba(249,115,22,0.12)',
  expenseText:     '#f97316',
  expenseGlow:     'rgba(249,115,22,0.10)',

  // ── States
  warning:         '#f5a623',
  warningLight:    'rgba(245,166,35,0.12)',
  warningDark:     '#d4820f',
  warningGlow:     'rgba(245,166,35,0.10)',
  danger:          '#ef4444',
  dangerLight:     'rgba(239,68,68,0.12)',
  dangerGlow:      'rgba(239,68,68,0.10)',

  // ── Allowability
  allowable:          '#22c55e',
  allowableLight:     'rgba(34,197,94,0.12)',
  notAllowable:       '#ef4444',
  notAllowableLight:  'rgba(239,68,68,0.12)',
  pendingReview:      '#f5a623',
  pendingReviewLight: 'rgba(245,166,35,0.12)',

  // ── Intelligence severity
  urgent:           '#ef4444',
  urgentLight:      'rgba(239,68,68,0.12)',
  attention:        '#f5a623',
  attentionLight:   'rgba(245,166,35,0.12)',
  info:             '#3b82f6',
  infoLight:        'rgba(59,130,246,0.12)',

  // ── Misc / backward-compat aliases
  teal:             '#22c55e',
  tealLight:        'rgba(34,197,94,0.12)',
  tealBar:          '#22c55e',
  overview:         '#f5a623',
  healthRing:       '#22c55e',
  intelligence:     '#8b5cf6',
  intelligenceGlow: 'rgba(139,92,246,0.10)',
  appleWhite:       '#ffffff',
  white:            '#ffffff',
  panelBorder:      'rgba(0,0,0,0.09)',
  orbAccent:        'rgba(249,115,22,0.28)',
  orbSky:           'rgba(245,166,35,0.14)',
  sidebarShadow:    'none',
} as const

// ─── Gradients ────────────────────────────────────────────────────────────────

export const gradients = {
  accent:       'linear-gradient(135deg, #f5a623 0%, #f97316 100%)',
  accentHover:  'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
  income:       'radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.22) 0%, transparent 70%)',
  expense:      'radial-gradient(ellipse at 80% 50%, rgba(249,115,22,0.22) 0%, transparent 70%)',
  intelligence: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.28) 0%, rgba(109,40,217,0.18) 50%, transparent 80%)',
  warning:      'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.22) 0%, transparent 70%)',
  danger:       'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.22) 0%, transparent 70%)',
  overview:     'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.18) 0%, rgba(34,197,94,0.10) 60%, transparent 90%)',
  orbAmbient:   'radial-gradient(circle, rgba(249,115,22,0.48) 0%, rgba(245,166,35,0.26) 30%, rgba(245,166,35,0.09) 55%, transparent 72%)',
  incomeText:   'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  expenseText:  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  healthRing:   'linear-gradient(135deg, #f5a623 0%, #22c55e 100%)',
} as const

export const semantic = {
  income:             '#22c55e',
  incomeLight:        'rgba(34,197,94,0.12)',
  expense:            '#f97316',
  expenseLight:       'rgba(249,115,22,0.12)',
  warning:            '#f5a623',
  warningLight:       'rgba(245,166,35,0.12)',
  warningDark:        '#d4820f',
  danger:             '#ef4444',
  dangerLight:        'rgba(239,68,68,0.12)',
  allowable:          '#22c55e',
  allowableLight:     'rgba(34,197,94,0.12)',
  notAllowable:       '#ef4444',
  notAllowableLight:  'rgba(239,68,68,0.12)',
  pendingReview:      '#f5a623',
  pendingReviewLight: 'rgba(245,166,35,0.12)',
  urgent:             '#ef4444',
  urgentLight:        'rgba(239,68,68,0.12)',
  attention:          '#f5a623',
  attentionLight:     'rgba(245,166,35,0.12)',
  info:               '#3b82f6',
  infoLight:          'rgba(59,130,246,0.12)',
  teal:               '#22c55e',
  tealLight:          'rgba(34,197,94,0.12)',
} as const

export const colours = light

export type ColourMode  = 'light' | 'dark'
export type ColourToken = keyof typeof light
