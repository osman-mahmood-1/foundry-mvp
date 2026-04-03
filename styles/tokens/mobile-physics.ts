/**
 * styles/tokens/mobile-physics.ts
 *
 * Platform-grade motion and blur constants for the mobile shell.
 * TypeScript constants — injected as raw values at build time.
 * Single source of truth for the "prestigious" Apple-style feel
 * across all portals (Client, Admin, Accountant).
 */

export const mobileBlur = {
  /** High-end frosted glass for the menu container */
  container: 'blur(30px) saturate(180%)',
  /** Dream-like resolve blur for cascading text items */
  item: 'blur(20px)',
} as const

export const mobileMotion = {
  /** Apple easeOutQuart — fast start, graceful deceleration on entrance */
  expand:   'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Apple easeInQuart — heavy start, accelerating exit */
  collapse: 'cubic-bezier(0.64, 0, 0.78, 0)',

  duration: {
    entrance: '0.5s',
    exit:     '0.28s',
    /** Per-item stagger delay in seconds */
    stagger:  0.04,
  },
} as const
