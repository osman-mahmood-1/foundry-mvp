/**
 * styles/tokens/typography.ts
 *
 * All typographic decisions in Foundry.
 * Fonts: Inter (UI) + JetBrains Mono (data/codes).
 * Loaded via next/font/google in app/layout.tsx.
 */

export const fonts = {
  sans: "var(--font-inter, 'Inter', sans-serif)",
  mono: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
} as const

export const fontWeight = {
  light:    '300',
  regular:  '400',
  medium:   '500',
  semibold: '600',
} as const

/**
 * Type scale. Named by role, not size.
 */
export const fontSize = {
  label: '11px',  // uppercase section labels
  xs:    '11px',  // secondary metadata
  sm:    '12px',  // table secondary text, footnotes
  base:  '13px',  // primary UI text, table rows
  md:    '14px',  // form inputs
  lg:    '16px',  // tab-level figures
  xl:    '24px',  // section headings
  hero:  '40px',  // page-level hero text
} as const

export const lineHeight = {
  tight:  1.15,
  normal: 1.5,
  body:   1.6,
  loose:  1.7,
} as const

export const letterSpacing = {
  tight:   '-0.02em',
  normal:  '0em',
  wide:    '0.06em',
  wider:   '0.08em',
  widest:  '0.12em',
  label:   '0.06em',  // for uppercase badge labels
} as const

/**
 * Google Fonts import — kept for reference only.
 * Actual loading is done via next/font/google in app/layout.tsx.
 */
export const fontImport =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'

/**
 * Semantic link styles.
 */
export const linkStyles = {
  interactive: {
    textDecoration:      'underline' as const,
    textDecorationStyle: 'solid' as const,
    textDecorationColor: '#00C2FF',
    cursor:              'pointer' as const,
  },
  decorative: {
    textDecoration:      'underline' as const,
    textDecorationStyle: 'dashed' as const,
    textDecorationColor: 'rgba(148,163,184,0.6)',
    cursor:              'default' as const,
  },
  footnote: {
    textDecoration:      'underline' as const,
    textDecorationStyle: 'dotted' as const,
    textDecorationColor: 'rgba(148,163,184,0.4)',
    cursor:              'default' as const,
  },
} as const
