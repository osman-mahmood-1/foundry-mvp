/**
 * styles/tokens/typography.ts
 *
 * All typographic decisions in Foundry.
 *
 * Three font families, each with a specific purpose:
 *   sans  — UI text, labels, body copy (DM Sans)
 *   serif — Headings, names, hero text (Playfair Display)
 *   mono  — Data, codes, timestamps, labels (JetBrains Mono)
 *
 * Link styles distinguish interactive vs decorative underlines.
 * A developer never guesses which style to use — they ask
 * "is this clickable?" and pick accordingly.
 */

export const fonts = {
  sans:  "'DM Sans', sans-serif",
  serif: "'Playfair Display', serif",
  mono:  "'JetBrains Mono', monospace",
} as const

export const fontWeight = {
  light:    '300',
  regular:  '400',
  medium:   '500',
  semibold: '600',
} as const

/**
 * Type scale. Named by role, not size.
 * A "label" is always a label regardless of its pixel size.
 * If we change label size globally, we change it here once.
 */
export const fontSize = {
  label:    '9px',   // mono uppercase section labels
  xs:       '11px',  // secondary metadata
  sm:       '12px',  // table secondary text, footnotes
  base:     '13px',  // primary UI text, table rows
  md:       '16px',  // form inputs
  lg:       '22px',  // tab-level figures (total income etc)
  xl:       '26px',  // greeting header
  hero:     '32px',  // page-level hero text
} as const

export const lineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.7,
} as const

export const letterSpacing = {
  tight:   '-0.02em',
  normal:  '0',
  wide:    '0.08em',
  wider:   '0.12em',
  widest:  '0.15em',
  label:   '0.14em',  // for mono uppercase labels
} as const

/**
 * Google Fonts import string.
 * Referenced once in the root layout — nowhere else.
 */
export const fontImport =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"

/**
 * Semantic link styles.
 * Never hardcode underline colours in components.
 * Ask: "is this clickable?" — use interactive.
 * Ask: "is this just decorated text?" — use decorative.
 */
export const linkStyles = {
  /** Teal solid underline. Used for clickable links and actions. */
  interactive: {
    textDecoration: 'underline' as const,
    textDecorationStyle: 'solid' as const,
    textDecorationColor: '#00D4AA',
    cursor: 'pointer' as const,
  },
  /** Dashed muted underline. Used for tooltips, glossary terms. */
  decorative: {
    textDecoration: 'underline' as const,
    textDecorationStyle: 'dashed' as const,
    textDecorationColor: 'rgba(148,163,184,0.6)',
    cursor: 'default' as const,
  },
  /** Dotted subtle underline. Used for footnotes and caveats. */
  footnote: {
    textDecoration: 'underline' as const,
    textDecorationStyle: 'dotted' as const,
    textDecorationColor: 'rgba(148,163,184,0.4)',
    cursor: 'default' as const,
  },
} as const
