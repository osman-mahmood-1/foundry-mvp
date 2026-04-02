import type { ColourMode } from './colours'

/**
 * styles/tokens/effects.ts
 *
 * Glass morphism, glow orbs, shadows — all from the mockup.
 *
 * Authority: lotech-dashboard-v9.html — no other source.
 *
 * glass.panel  = the inner container wrapping portal content (blur 40px)
 * glass.card   = stat/metric cards inside the container (blur 24px)
 * glass.slidePanel = the right-side slide-in panel (blur 48px)
 *
 * Note on border-top highlight:
 *   The mockup uses border-top-color override for a "glass edge" shimmer.
 *   We achieve this via borderTopColor in the returned style object.
 *   Callers must use individual border properties (borderTop, etc.)
 *   rather than the shorthand `border` to avoid overriding borderTopColor.
 */

export const glass = {

  /** Inner container — the main glass panel wrapping all portal content. */
  panel: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark'
      ? 'rgba(13,10,7,0.72)'
      : 'rgba(248,243,235,0.78)',
    backdropFilter:       'blur(40px) saturate(150%) brightness(1.06)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%) brightness(1.06)',
    // Use individual border sides so borderTopColor takes effect
    borderLeft:           mode === 'dark'
      ? '1px solid rgba(255,255,255,0.11)'
      : '1px solid rgba(0,0,0,0.09)',
    borderRight:          mode === 'dark'
      ? '1px solid rgba(255,255,255,0.11)'
      : '1px solid rgba(0,0,0,0.09)',
    borderBottom:         mode === 'dark'
      ? '1px solid rgba(255,255,255,0.11)'
      : '1px solid rgba(0,0,0,0.09)',
    borderTop:            mode === 'dark'
      ? '1px solid rgba(255,255,255,0.16)'   // top highlight (glass edge shimmer)
      : '1px solid rgba(255,255,255,0.80)',
    borderRadius:         '18px',
    boxShadow:            mode === 'dark'
      ? '0 2px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.65)'
      : '0 1px 0 rgba(255,255,255,0.5) inset, 0 0 0 1px rgba(0,0,0,0.06), 0 20px 60px rgba(100,70,20,0.20)',
  }),

  /** Stat / metric cards — slightly less opaque so orb layers show through. */
  card: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark'
      ? 'rgba(20,16,11,0.60)'
      : 'rgba(255,252,246,0.65)',
    backdropFilter:       'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    borderLeft:           mode === 'dark'
      ? '1px solid rgba(255,255,255,0.09)'
      : '1px solid rgba(0,0,0,0.07)',
    borderRight:          mode === 'dark'
      ? '1px solid rgba(255,255,255,0.09)'
      : '1px solid rgba(0,0,0,0.07)',
    borderBottom:         mode === 'dark'
      ? '1px solid rgba(255,255,255,0.09)'
      : '1px solid rgba(0,0,0,0.07)',
    borderTop:            mode === 'dark'
      ? '1px solid rgba(255,255,255,0.12)'   // card top highlight
      : '1px solid rgba(255,255,255,0.70)',
    borderRadius:         '14px',
    boxShadow:            mode === 'dark'
      ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 4px 18px rgba(160,120,60,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
  }),

  /** Right-side slide panel (near-opaque, heavy blur). */
  slidePanel: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark'
      ? 'rgba(11,9,6,0.99)'
      : 'rgba(248,244,236,0.99)',
    backdropFilter:       'blur(48px) saturate(200%)',
    WebkitBackdropFilter: 'blur(48px) saturate(200%)',
    borderLeft:           mode === 'dark'
      ? '1px solid rgba(255,255,255,0.09)'
      : '1px solid rgba(0,0,0,0.09)',
  }),

}

/**
 * glassStatic — backward-compatible static exports (light theme).
 * These are the same values as glass.card('light') / glass.panel('light').
 * Existing components that spread these get the warm light-theme glass styles.
 */
export const glassStatic = {
  panel: glass.card('light'),
  card:  glass.card('light'),
} as const

/**
 * Glow overlays — positioned absolutely inside cards/panels.
 * These are the coloured radial blurs behind content.
 */
export const glows = {
  income: {
    background:    'radial-gradient(ellipse at 30% 60%, rgba(34,197,94,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  expense: {
    background:    'radial-gradient(ellipse at 70% 60%, rgba(249,115,22,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  intelligence: {
    background:    'radial-gradient(ellipse at 50% 20%, rgba(139,92,246,0.30) 0%, rgba(109,40,217,0.18) 55%, transparent 80%)',
    filter:        'blur(40px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  overview: {
    background:    'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.20) 0%, rgba(34,197,94,0.10) 60%, transparent 90%)',
    filter:        'blur(48px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  warning: {
    background:    'radial-gradient(ellipse at 50% 30%, rgba(245,166,35,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  danger: {
    background:    'radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
} as const

/**
 * Ambient orb — the large fixed background orb (top-right).
 * Exactly as specified in the mockup: 900×900px, orange/gold radial, blur 65px.
 * Light mode: opacity 0.6 via `orbOpacity` token.
 */
export const orbs = {
  /** Main ambient orb: fixed top-right, 900px, warm orange/gold. */
  ambient: {
    position:     'fixed' as const,
    top:          '-260px',
    right:        '-200px',
    width:        '900px',
    height:       '900px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(249,115,22,0.48) 0%, rgba(245,166,35,0.26) 30%, rgba(245,166,35,0.09) 55%, transparent 72%)',
    filter:       'blur(65px)',
    pointerEvents:'none' as const,
    zIndex:       0,
  },
  /** Ambient orb opacity per theme */
  ambientOpacityDark:  1,
  ambientOpacityLight: 0.6,

  /** Legacy names kept for any existing references */
  blueTopRight: {
    top:          '-260px',
    right:        '-200px',
    width:        '900px',
    height:       '900px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(249,115,22,0.48) 0%, rgba(245,166,35,0.26) 30%, rgba(245,166,35,0.09) 55%, transparent 72%)',
    filter:       'blur(65px)',
  },
  skyBottomLeft: {
    bottom:       '-15%',
    left:         '10%',
    width:        '400px',
    height:       '400px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
    filter:       'blur(80px)',
  },
  tealMidLeft: {
    top:          '30%',
    left:         '-8%',
    width:        '300px',
    height:       '300px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
    filter:       'blur(60px)',
  },

  /** Card-level orbs — small coloured blur behind each stat card. */
  cardGold: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(245,166,35,0.75) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardGreen: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(34,197,94,0.65) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardPurple: {
    width:        '140px',
    height:       '140px',
    background:   'radial-gradient(circle, rgba(139,92,246,0.70) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardOrange: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(249,115,22,0.60) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardBlue: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(59,130,246,0.60) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
} as const

/**
 * Shadow scale.
 * Values derived from mockup shadow tokens.
 */
export const shadows = {
  none:        'none',
  xs:          '0 1px 3px rgba(0,0,0,0.08)',
  sm:          '0 2px 8px rgba(0,0,0,0.10)',
  md:          '0 4px 24px rgba(0,0,0,0.10)',
  lg:          '0 8px 40px rgba(0,0,0,0.14)',
  xl:          '0 16px 64px rgba(0,0,0,0.18)',
  accent:      '0 4px 24px rgba(245,166,35,0.38)',
  accentHover: '0 6px 28px rgba(245,166,35,0.60)',
  accentDark:  '0 4px 24px rgba(245,166,35,0.20)',
  income:      '0 4px 20px rgba(34,197,94,0.25)',
  expense:     '0 4px 20px rgba(249,115,22,0.25)',
  inset:       'inset 0 1px 0 rgba(255,255,255,0.08)',
} as const
