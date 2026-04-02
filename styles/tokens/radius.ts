/**
 * styles/tokens/radius.ts
 *
 * Border radius scale — all from the mockup.
 *
 * Authority: lotech-dashboard-v9.html — no other source.
 *
 * --radius:    14px  → card (stat cards, standard panels)
 * --radius-sm: 10px  → input fields, nav items, small buttons
 * container:   18px  → inner container (main glass panel)
 * pill:        100px → fully-rounded buttons and badges
 */

export const radius = {
  none:      '0px',
  xs:        '6px',    // alias → --radius-sm
  sm:        '6px',    // --radius-sm: badges, tags, chips, tooltips, small labels
  md:        '10px',   // --radius-md: buttons, inputs, selects, dropdowns, toggle controls
  lg:        '14px',   // --radius-lg: cards, panels, modals, drawers, slide panels, toasts
  xl:        '14px',   // alias → --radius-lg
  container: '18px',   // inner glass shell (outside the 3-tier system)
  sidebar:   '18px',   // alias: sidebar panel radius
  panel:     '14px',   // alias → --radius-lg
  card:      '14px',   // alias → --radius-lg
  modal:     '14px',   // --radius-lg (modals use lg per spec)
  pill:      '100px',  // fully-rounded — use sparingly (avatars, tags only)
  circle:    '50%',    // avatar, spinner, status dots
} as const

export type RadiusToken = keyof typeof radius
