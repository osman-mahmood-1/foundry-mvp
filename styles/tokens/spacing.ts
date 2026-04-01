/**
 * styles/tokens/spacing.ts
 *
 * Spacing scale for padding, margin, and gap.
 * Based on a 4px base unit — the same grid Apple and
 * most professional design systems use.
 *
 * Named by size (2, 4, 6...) not purpose, because spacing
 * is contextual. Semantic spacing lives in component tokens.
 */

export const space = {
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  7:   '28px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
} as const

/**
 * Semantic spacing — named by context.
 * These are the values you use in components.
 * If the designer says "increase panel padding",
 * change panel.padding here — not in every component.
 */
export const spacing = {
  panel: {
    padding:      space[6],   // 24px — standard panel internal padding
    paddingLg:    space[8],   // 32px — hero panels
    paddingTight: space[5],   // 20px — compact panels
  },
  sidebar: {
    padding:       space[3],    // 12px — outer horizontal padding
    userPadding:   space[6],    // 24px — user identity section top padding
    itemPaddingV:  '6px',        // vertical padding on each nav item
    itemPaddingH:  '10px',       // horizontal padding on each nav item
    groupGap:      space[3],     // 12px — space above each group label
    itemGap:       '1px',        // gap between individual nav items
  },
  form: {
    fieldGap:     space[3],   // 12px — between form fields
    labelGap:     space[1],   // 6px  — between label and input (using 1.5x)
    sectionGap:   space[8],   // 32px — between form sections
  },
  table: {
    rowPadding:   `${space[3]} ${space[5]}`,  // 12px 20px
    headerPadding:`${space[3]} ${space[5]}`,
  },
  tab: {
    gap:          space[3],   // 12px — between tab panels
  },
} as const
