/**
 * styles/tokens/index.ts
 *
 * Single import point for the entire Foundry design system.
 *
 * Every component imports from here:
 *   import { colours, glass, radius, motion } from '@/styles/tokens'
 *
 * Nothing else. No hardcoded hex values in component files.
 * No inline transition strings. No ad-hoc border radius values.
 *
 * If you find a magic value in a component file, move it here.
 */

export * from './colours'
export * from './typography'
export * from './spacing'
export * from './effects'
export * from './motion'
export * from './radius'
