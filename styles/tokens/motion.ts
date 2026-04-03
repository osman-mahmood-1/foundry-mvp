/**
 * styles/tokens/motion.ts
 *
 * Animation durations, easing curves, and transition shorthands.
 *
 * Currently the codebase has transition values scattered across
 * dozens of files ('all 0.15s ease', 'all 0.2s', etc.).
 * All of those are replaced by references to this file.
 *
 * Named after what they feel like, not their numeric value.
 * 'spring' feels like a spring. 'snap' feels instant but not jarring.
 */

export const duration = {
  instant:    '0.1s',
  snap:       '0.15s',
  fast:       '0.2s',
  normal:     '0.3s',
  slow:       '0.4s',
  reveal:     '0.5s',
  lazy:       '0.6s',
  appleOpen:  '0.7s',
  appleClose: '0.45s',
} as const

/** Stagger delay between cascading items (seconds, use as a multiplier). */
export const stagger = 0.06

/**
 * Easing curves.
 * standard   — most UI transitions (hover states, colour changes)
 * spring     — elements entering the screen (progress bars, panels)
 * decelerate — elements coming to rest (dropdowns closing)
 * accelerate — elements leaving the screen (dismissals)
 */
export const easing = {
  standard:      'ease',
  spring:        'cubic-bezier(0.16, 1, 0.3, 1)',
  decelerate:    'cubic-bezier(0.0, 0.0, 0.2, 1)',
  accelerate:    'cubic-bezier(0.4, 0.0, 1, 1)',
  linear:        'linear',
  /** Apple-style quartic burst: fast start, long graceful deceleration (easeOutQuart) */
  appleExpand:   'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Apple-style quartic retract: heavy start, accelerating exit (easeInQuart) */
  appleCollapse: 'cubic-bezier(0.64, 0, 0.78, 0)',
} as const

/**
 * Pre-composed transition shorthands for the most common cases.
 * Use these on style={{ transition: motion.transition.fast }} rather
 * than writing transition strings inline.
 */
export const transition = {
  snap:    `all ${duration.snap} ${easing.standard}`,
  fast:    `all ${duration.fast} ${easing.standard}`,
  normal:  `all ${duration.normal} ${easing.standard}`,
  spring:  `all ${duration.reveal} ${easing.spring}`,
  reveal:  `opacity ${duration.slow} ${easing.decelerate}, transform ${duration.slow} ${easing.decelerate}`,
} as const

/**
 * Keyframe animation names.
 * The actual @keyframes are injected once in the root layout.
 * Components reference these names in their animation properties.
 */
export const animations = {
  fadeUp:  'fadeUp',
  fadeIn:  'fadeIn',
  spin:    'spin',
  pulse:   'orbPulse',
  float1:  'orbFloat1',
  float2:  'orbFloat2',
} as const

/**
 * Global keyframe CSS string — injected once in PortalShell.
 * Not repeated in individual components.
 */
export const keyframes = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes orbPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  @keyframes orbFloat1 {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(40px, 30px) scale(1.15); }
    66%  { transform: translate(-20px, 50px) scale(0.95); }
    100% { transform: translate(0, 0) scale(1); }
  }
  @keyframes orbFloat2 {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(-50px, -30px) scale(1.2); }
    66%  { transform: translate(30px, -40px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
`
