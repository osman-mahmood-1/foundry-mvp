/**
 * styles/tokens/effects.ts
 *
 * Visual effects: glassmorphism, orbs, gradients, shadows, blurs.
 *
 * Every orb, every glass panel, every gradient in the product
 * is defined here. To add a new page with orbs: import the recipe,
 * place the div. To remove orbs from the entire product: delete
 * the orb definitions here and fix the type errors.
 *
 * Components consume these as spread objects:
 *   <div style={{ ...effects.glass.panel, padding: '24px' }} />
 */

// ─── Glassmorphism ────────────────────────────────────────────────────────────

export const glass = {
  /**
   * Standard panel. Used for all content cards in the portal.
   * White frosted glass over the light blue page background.
   */
  panel: {
    background:        'rgba(255,255,255,0.72)',
    backdropFilter:    'blur(48px)',
    WebkitBackdropFilter: 'blur(48px)',
    border:            '1px solid rgba(255,255,255,0.95)',
    borderRadius:      '16px',
    boxShadow:         '0 4px 32px rgba(5,28,44,0.07), inset 0 1px 0 rgba(255,255,255,1)',
  },

  /**
   * Sidebar panel. Slightly more opaque than content panels.
   * Heavier shadow to lift it above the page background.
   */
  sidebar: {
    background:        'rgba(255,255,255,0.78)',
    backdropFilter:    'blur(48px)',
    WebkitBackdropFilter: 'blur(48px)',
    border:            '1px solid rgba(255,255,255,0.98)',
    borderRadius:      '18px',
    boxShadow:         '0 8px 40px rgba(5,28,44,0.08), inset 0 1px 0 rgba(255,255,255,1)',
  },

  /**
   * Modal / card overlay. Heavier blur, more opaque.
   * Used for onboarding cards, intelligence cards, overlays.
   */
  card: {
    background:        'rgba(255,255,255,0.82)',
    backdropFilter:    'blur(48px)',
    WebkitBackdropFilter: 'blur(48px)',
    border:            '1px solid rgba(255,255,255,0.98)',
    borderRadius:      '24px',
    boxShadow:         '0 8px 48px rgba(5,28,44,0.09), inset 0 1px 0 rgba(255,255,255,1)',
  },

  /**
   * Dark glass. Used for the waitlist/passport dark theme.
   * Not used in the main portal but kept here for consistency.
   */
  dark: {
    background:        'rgba(12,8,18,0.78)',
    backdropFilter:    'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border:            '1px solid rgba(255,255,255,0.10)',
    borderRadius:      '28px',
  },
} as const


// ─── Orbs ─────────────────────────────────────────────────────────────────────

/**
 * Ambient background orbs. Fixed-position, pointer-events none.
 * The position is intentionally off-screen (negative top/right)
 * so they bleed in from the edges rather than sitting on the page.
 *
 * Usage:
 *   <div style={{ position: 'fixed', ...effects.orbs.tealTopRight, pointerEvents: 'none' }} />
 */
export const orbs = {
  /** Teal orb, top-right. Used across the main portal. */
  tealTopRight: {
    top:          '-10%',
    right:        '-5%',
    width:        '500px',
    height:       '500px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
    filter:       'blur(40px)',
  },

  /** Navy orb, bottom-left. Subtle depth behind the sidebar. */
  navyBottomLeft: {
    bottom:       '-10%',
    left:         '20%',
    width:        '400px',
    height:       '400px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(5,28,44,0.04) 0%, transparent 70%)',
    filter:       'blur(60px)',
  },

  /** Coral orb. Used on the dark waitlist/passport pages. */
  coralTopLeft: {
    top:          '-130px',
    left:         '-90px',
    width:        '420px',
    height:       '420px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(255,100,60,0.22) 0%, transparent 68%)',
    filter:       'blur(50px)',
  },

  /** Violet orb. Paired with coral on dark pages. */
  violetBottomRight: {
    bottom:       '-80px',
    right:        '-80px',
    width:        '340px',
    height:       '340px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(160,60,255,0.20) 0%, transparent 70%)',
    filter:       'blur(48px)',
  },
} as const


// ─── Gradients ────────────────────────────────────────────────────────────────

export const gradients = {
  /** Teal accent bar — used on progress indicators and top borders */
  tealBar:    'linear-gradient(90deg, #00D4AA, #00F5C4)',

  /** Teal progress glow — used on progress bar fill */
  tealGlow:   'linear-gradient(90deg, #00D4AA, #00F5C4)',

  /** Dark page background — used on waitlist/passport pages */
  darkPage:   '#08080f',

  /** Glass border gradient — used on the passport card neon border */
  glassBorder: 'linear-gradient(135deg, rgba(194,232,226,0.8) 0%, rgba(74,143,160,0.6) 50%, rgba(194,232,226,0.4) 100%)',

  /** Hero text gradient — teal to blue for highlighted heading spans */
  heroText:   'linear-gradient(180deg, #c2e8e2 0%, #4a8fa0 100%)',
} as const


// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  none:    'none',
  sm:      '0 2px 8px rgba(5,28,44,0.06)',
  md:      '0 4px 32px rgba(5,28,44,0.07)',
  lg:      '0 8px 40px rgba(5,28,44,0.08)',
  xl:      '0 8px 48px rgba(5,28,44,0.09)',
  teal:    '0 0 8px rgba(0,212,170,0.4)',
  coral:   '0 8px 28px rgba(255,100,60,0.35)',
  inset:   'inset 0 1px 0 rgba(255,255,255,1)',
} as const
