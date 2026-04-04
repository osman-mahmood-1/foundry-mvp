import type { ColourMode } from './colours'
import { tabTransition } from './motion'

/**
 * styles/tokens/effects.ts
 *
 * Glass morphism, glow orbs, shadows — all from the new sapphire/teal/copper palette.
 *
 * glass.panel  = the inner container wrapping portal content (blur 40px)
 * glass.card   = stat/metric cards inside the container (blur 36px dark / 24px light)
 * glass.slidePanel = the right-side slide-in panel (blur 48px dark / no blur light)
 *
 * Note on card hover border:
 *   Add className="glass-card" alongside glass.card() styles to enable the
 *   sapphire→teal gradient border that appears on hover (defined in globals.css).
 */

export const glass = {

  /** Inner container — the main glass panel wrapping all portal content. */
  panel: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark'
      ? 'radial-gradient(ellipse 80% 70% at 0% 100%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.44) 42%, transparent 72%), rgba(8,12,22,0.65)'
      : 'rgba(255,255,255,0.72)',
    backdropFilter:       'blur(40px) saturate(140%) brightness(1.03)',
    WebkitBackdropFilter: 'blur(40px) saturate(140%) brightness(1.03)',
    borderLeft:           mode === 'dark'
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(15,23,42,0.08)',
    borderRight:          mode === 'dark'
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(15,23,42,0.08)',
    borderBottom:         mode === 'dark'
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(15,23,42,0.08)',
    borderTop:            mode === 'dark'
      ? '1px solid rgba(255,255,255,0.14)'   // top highlight (glass edge shimmer)
      : '1px solid rgba(255,255,255,0.98)',
    borderRadius:         '18px',
    boxShadow:            mode === 'dark'
      ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.06), 0 28px 72px rgba(0,0,0,0.80)'
      : 'inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 1px rgba(15,23,42,0.07)',
  }),

  /** Stat / metric cards. Add className="glass-card" for hover border gradient. */
  card: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark'
      ? 'rgba(0,0,0,0.75)'
      : 'rgba(255,255,255,0.78)',
    backdropFilter:       mode === 'dark'
      ? 'blur(36px) saturate(180%) brightness(0.88)'
      : 'blur(24px) saturate(120%) brightness(1.02)',
    WebkitBackdropFilter: mode === 'dark'
      ? 'blur(36px) saturate(180%) brightness(0.88)'
      : 'blur(24px) saturate(120%) brightness(1.02)',
    borderLeft:           mode === 'dark'
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid rgba(15,23,42,0.07)',
    borderRight:          mode === 'dark'
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid rgba(15,23,42,0.07)',
    borderBottom:         mode === 'dark'
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid rgba(15,23,42,0.07)',
    borderTop:            mode === 'dark'
      ? '1px solid rgba(255,255,255,0.07)'
      : '1px solid rgba(255,255,255,0.95)',
    borderRadius:         '14px',
    boxShadow:            mode === 'dark'
      ? 'inset 0 1px 0 rgba(255,255,255,0.07)'
      : '0 2px 16px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
    animation:            tabTransition.animation,
    willChange:           'opacity, filter',
    transform:            'translateZ(0)',  // Forces GPU compositing layer in Chrome before animation starts
  }),

  /** Right-side slide panel (near-opaque). No backdrop-filter in light to avoid seam. */
  slidePanel: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark'
      ? 'rgba(4,6,12,0.99)'
      : 'rgba(255,254,252,0.99)',
    ...(mode === 'dark' ? {
      backdropFilter:       'blur(48px) saturate(200%)',
      WebkitBackdropFilter: 'blur(48px) saturate(200%)',
    } : {}),
    borderLeft:           mode === 'dark'
      ? '1px solid rgba(255,255,255,0.10)'
      : '1px solid rgba(15,23,42,0.08)',
  }),

}

/**
 * glassStatic — backward-compatible static exports (light theme).
 */
export const glassStatic = {
  panel: glass.card('light'),
  card:  glass.card('light'),
} as const

/**
 * Glow overlays — positioned absolutely inside cards/panels.
 */
export const glows = {
  income: {
    background:    'radial-gradient(ellipse at 30% 60%, rgba(34,211,165,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  expense: {
    background:    'radial-gradient(ellipse at 70% 60%, rgba(248,113,113,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  intelligence: {
    background:    'radial-gradient(ellipse at 50% 20%, rgba(167,139,250,0.30) 0%, rgba(124,58,237,0.18) 55%, transparent 80%)',
    filter:        'blur(40px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  overview: {
    background:    'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.20) 0%, rgba(34,211,165,0.10) 60%, transparent 90%)',
    filter:        'blur(48px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  warning: {
    background:    'radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
  danger: {
    background:    'radial-gradient(ellipse at 50% 30%, rgba(248,113,113,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '14px',
    pointerEvents: 'none' as const,
  },
} as const

/**
 * Ambient orb — large fixed background orb (top-right).
 * 1080×1080px, sapphire/teal radial, blur 90px.
 */
export const orbs = {
  /** Main ambient orb: fixed top-right, 1080px, pure sapphire. */
  ambient: {
    position:     'fixed' as const,
    top:          '-300px',
    right:        '-240px',
    width:        '1080px',
    height:       '1080px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0.06) 45%, transparent 72%)',
    filter:       'blur(90px)',
    pointerEvents:'none' as const,
    zIndex:       0,
  },
  /** Ambient orb opacity per theme */
  ambientOpacityDark:  0.60,
  ambientOpacityLight: 0.50,

  /**
   * Desktop ambient orb — 20% larger (1296px), 10% more intense colour stops.
   * Use on desktop layouts only. Mobile uses the standard ambient values above.
   */
  ambientDesktop: {
    position:     'fixed' as const,
    top:          '-360px',
    right:        '-288px',
    width:        '1296px',
    height:       '1296px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.066) 45%, transparent 72%)',
    filter:       'blur(90px)',
    pointerEvents:'none' as const,
    zIndex:       0,
  },
  ambientOpacityDesktopDark:  0.66,
  ambientOpacityDesktopLight: 0.55,

  /** Legacy names kept for any existing references */
  blueTopRight: {
    top:          '-300px',
    right:        '-240px',
    width:        '1080px',
    height:       '1080px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0.06) 45%, transparent 72%)',
    filter:       'blur(90px)',
  },
  skyBottomLeft: {
    bottom:       '-15%',
    left:         '10%',
    width:        '400px',
    height:       '400px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
    filter:       'blur(80px)',
  },
  tealMidLeft: {
    top:          '30%',
    left:         '-8%',
    width:        '300px',
    height:       '300px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(34,211,165,0.06) 0%, transparent 70%)',
    filter:       'blur(60px)',
  },

  /** Card-level orbs — small coloured blur behind each stat card. */
  cardGold: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(232,146,42,0.75) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardGreen: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(34,211,165,0.85) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardPurple: {
    width:        '140px',
    height:       '140px',
    background:   'radial-gradient(circle, rgba(167,139,250,0.70) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardOrange: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(232,146,42,0.75) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
  cardBlue: {
    width:        '130px',
    height:       '130px',
    background:   'radial-gradient(circle, rgba(59,130,246,0.80) 0%, transparent 70%)',
    filter:       'blur(38px)',
  },
} as const

/**
 * Shadow scale.
 */
export const shadows = {
  none:        'none',
  xs:          '0 1px 3px rgba(0,0,0,0.08)',
  sm:          '0 2px 8px rgba(0,0,0,0.10)',
  md:          '0 4px 24px rgba(0,0,0,0.10)',
  lg:          '0 8px 40px rgba(0,0,0,0.14)',
  xl:          '0 16px 64px rgba(0,0,0,0.18)',
  accent:      '0 4px 24px rgba(59,130,246,0.30)',
  accentHover: '0 6px 28px rgba(59,130,246,0.45)',
  accentDark:  '0 4px 24px rgba(59,130,246,0.18)',
  income:      '0 4px 20px rgba(34,211,165,0.25)',
  expense:     '0 4px 20px rgba(248,113,113,0.25)',
  inset:       'inset 0 1px 0 rgba(255,255,255,0.08)',
} as const
