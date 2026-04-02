/**
 * styles/tokens/typography.ts
 *
 * All typographic decisions in Foundry.
 * Font: Outfit (300–800 weights).
 * Loaded via next/font/google in app/layout.tsx.
 *
 * Authority: lotech-dashboard-v9.html mockup — no other source.
 */

export const fonts = {
  sans: "var(--font-outfit, 'Outfit', sans-serif)",
  mono: "var(--font-outfit, 'Outfit', sans-serif)",  // Outfit replaces mono too
} as const

export const fontWeight = {
  light:    '300',
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  black:    '800',
} as const

/**
 * Type scale — named by role.
 * Derived from mockup font-size values.
 */
export const fontSize = {
  label: '10px',   // nav section labels (uppercase, letter-spaced)
  xs:    '11px',   // secondary metadata, badges
  sm:    '12px',   // table secondary, footnotes, panel-tab
  base:  '13px',   // primary UI text, nav items, form text
  md:    '14px',   // form inputs, panel-tab active
  lg:    '15px',   // topbar brand name
  xl:    '17px',   // brand name
  '2xl': '19px',   // stat values
  '3xl': '20px',   // inner page title
  '4xl': '24px',   // section headings
  hero:  '36px',   // profit amount hero
} as const

export const lineHeight = {
  tight:  1.15,
  normal: 1.5,
  body:   1.6,
  loose:  1.7,
} as const

export const letterSpacing = {
  tight:   '-0.03em',
  tight2:  '-0.02em',
  normal:  '0em',
  wide:    '0.06em',
  wider:   '0.08em',
  widest:  '0.12em',
  label:   '0.10em',   // for uppercase nav section labels
} as const

/**
 * Google Fonts URL — reference only.
 * Actual loading is done via next/font/google in app/layout.tsx.
 */
export const fontImport =
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'

/**
 * Semantic link styles using mockup palette.
 */
export const linkStyles = {
  interactive: {
    textDecoration:      'underline' as const,
    textDecorationStyle: 'solid' as const,
    textDecorationColor: '#f5a623',
    cursor:              'pointer' as const,
  },
  decorative: {
    textDecoration:      'underline' as const,
    textDecorationStyle: 'dashed' as const,
    textDecorationColor: 'rgba(154,144,128,0.6)',
    cursor:              'default' as const,
  },
  footnote: {
    textDecoration:      'underline' as const,
    textDecorationStyle: 'dotted' as const,
    textDecorationColor: 'rgba(154,144,128,0.4)',
    cursor:              'default' as const,
  },
} as const
