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
  xs:        '6px',    // inline badges, tiny chips
  sm:        '8px',    // small buttons
  md:        '10px',   // --radius-sm: form inputs, nav items
  lg:        '12px',   // medium panels
  xl:        '14px',   // --radius: stat cards, standard panels
  container: '18px',   // inner container (the glass shell)
  sidebar:   '18px',   // alias: sidebar panel radius
  panel:     '14px',   // standard glassmorphic panels (alias for xl)
  card:      '14px',   // --radius: cards
  modal:     '18px',   // large modals / overlays
  pill:      '100px',  // fully-rounded buttons, category badges
  circle:    '50%',    // avatar, spinner, status dots
} as const

export type RadiusToken = keyof typeof radius
