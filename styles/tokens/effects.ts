import type { ColourMode } from './colours'

export const glass = {
  panel: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark' ? 'rgba(19,22,29,0.80)' : 'rgba(255,255,255,0.82)',
    backdropFilter:       'blur(18px) saturate(160%)',
    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
    border:               mode === 'dark' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
    borderRadius:         '14px',
    boxShadow:            mode === 'dark'
      ? '0 4px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
  }),
  card: (mode: ColourMode = 'light'): React.CSSProperties => ({
    background:           mode === 'dark' ? 'rgba(19,22,29,0.92)' : 'rgba(255,255,255,0.92)',
    backdropFilter:       'blur(18px) saturate(160%)',
    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
    border:               mode === 'dark' ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.07)',
    borderRadius:         '16px',
    boxShadow:            mode === 'dark'
      ? '0 8px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)',
  }),
} as const

export const glassStatic = {
  panel: {
    background:           'rgba(255,255,255,0.82)',
    backdropFilter:       'blur(18px) saturate(160%)',
    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
    border:               '1px solid rgba(0,0,0,0.07)',
    borderRadius:         '14px',
    boxShadow:            '0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
  },
  card: {
    background:           'rgba(255,255,255,0.92)',
    backdropFilter:       'blur(18px) saturate(160%)',
    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
    border:               '1px solid rgba(0,0,0,0.07)',
    borderRadius:         '16px',
    boxShadow:            '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)',
  },
} as const

export const glows = {
  income: {
    background:    'radial-gradient(ellipse at 30% 60%, rgba(16,185,129,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '16px',
    pointerEvents: 'none' as const,
  },
  expense: {
    background:    'radial-gradient(ellipse at 70% 60%, rgba(0,194,255,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '16px',
    pointerEvents: 'none' as const,
  },
  intelligence: {
    background:    'radial-gradient(ellipse at 50% 20%, rgba(0,194,255,0.30) 0%, rgba(0,148,204,0.18) 55%, transparent 80%)',
    filter:        'blur(40px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '16px',
    pointerEvents: 'none' as const,
  },
  overview: {
    background:    'radial-gradient(ellipse at 50% 0%, rgba(0,194,255,0.20) 0%, rgba(16,185,129,0.12) 60%, transparent 90%)',
    filter:        'blur(48px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '16px',
    pointerEvents: 'none' as const,
  },
  warning: {
    background:    'radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '16px',
    pointerEvents: 'none' as const,
  },
  danger: {
    background:    'radial-gradient(ellipse at 50% 30%, rgba(244,63,94,0.22) 0%, transparent 70%)',
    filter:        'blur(32px)',
    position:      'absolute' as const,
    inset:         0,
    borderRadius:  '16px',
    pointerEvents: 'none' as const,
  },
} as const

export const orbs = {
  blueTopRight: {
    top:          '-15%',
    right:        '-10%',
    width:        '600px',
    height:       '600px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(0,194,255,0.08) 0%, transparent 70%)',
    filter:       'blur(60px)',
  },
  skyBottomLeft: {
    bottom:       '-15%',
    left:         '10%',
    width:        '500px',
    height:       '500px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(0,194,255,0.06) 0%, transparent 70%)',
    filter:       'blur(80px)',
  },
  tealMidLeft: {
    top:          '30%',
    left:         '-8%',
    width:        '300px',
    height:       '300px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
    filter:       'blur(60px)',
  },
} as const

export const shadows = {
  none:        'none',
  xs:          '0 1px 3px rgba(0,0,0,0.08)',
  sm:          '0 2px 8px rgba(0,0,0,0.10)',
  md:          '0 4px 24px rgba(0,0,0,0.10)',
  lg:          '0 8px 40px rgba(0,0,0,0.14)',
  xl:          '0 16px 64px rgba(0,0,0,0.18)',
  accent:      '0 4px 24px rgba(0,194,255,0.30)',
  accentDark:  '0 4px 24px rgba(0,194,255,0.20)',
  income:      '0 4px 20px rgba(16,185,129,0.25)',
  expense:     '0 4px 20px rgba(0,194,255,0.25)',
  inset:       'inset 0 1px 0 rgba(255,255,255,0.10)',
} as const
