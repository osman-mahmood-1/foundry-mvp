/**
 * styles/tokens/radius.ts
 *
 * Border radius scale.
 *
 * Named by visual feel, not pixel value.
 * 'pill' is always a fully-rounded button/badge.
 * 'card' is always a large-radius content panel.
 *
 * To make the entire UI more rounded: increase these values.
 * To make it sharper and more corporate: decrease them.
 * One file, one change, entire product re-skins.
 */

export const radius = {
  none:   '0px',
  xs:     '6px',    // inline badges, small chips
  sm:     '8px',    // nav items, small buttons
  md:     '10px',   // form inputs
  lg:     '12px',   // standard buttons
  xl:     '14px',   // select cards (trade type picker)
  panel:  '16px',   // standard glassmorphic panels
  sidebar:'18px',   // sidebar panel
  card:   '24px',   // onboarding card, intelligence cards
  modal:  '28px',   // passport card, large modals
  pill:   '100px',  // fully-rounded buttons, category badges
  circle: '50%',    // avatar, spinner, status dots
} as const

export type RadiusToken = keyof typeof radius
