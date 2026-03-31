/**
 * lib/errors.ts
 *
 * Centralised application error registry.
 *
 * Every user-visible error in Foundry has a code, a title, and
 * a human-readable message. Codes are included in UI banners so
 * users can quote them to support and engineers can cross-reference
 * with Vercel function logs.
 *
 * Rules:
 * - No alarming vocabulary ("failed", "failure", "error" in messages)
 * - No implied data risk — don't mention what didn't happen to the user's data
 * - internal: true  → "we're reviewing it" tone (platform fault)
 * - internal: false → explain what happened, give the user a clear next step
 */

export interface AppError {
  /** Short code quoted to support and logged to Vercel. e.g. "INCOME_002" */
  code:      string
  /** Short title shown at the top of the error banner */
  title:     string
  /** One-sentence explanation of what happened */
  message:   string
  /** What the user can do next — omit for internal errors */
  action?:   string
  /** true = platform fault; shows "we're reviewing it" tone */
  internal:  boolean
}

// ─── Internal error template ──────────────────────────────────────────────────

const INTERNAL_MESSAGE =
  "We've spotted a hiccup on our end. We're reviewing it and will have this resolved shortly."

// ─── Registry ─────────────────────────────────────────────────────────────────

export const APP_ERRORS = {

  // ── Auth ──────────────────────────────────────────────────────────────────

  AUTH_001: {
    code:     'AUTH_001',
    title:    'Sign-in link expired',
    message:  'Magic links are single-use and expire after 24 hours for your security.',
    action:   'Enter your email below to receive a new one.',
    internal: false,
  },

  AUTH_002: {
    code:     'AUTH_002',
    title:    'Sign-in interrupted',
    message:  'Something interrupted your sign-in.',
    action:   'Please request a new link below.',
    internal: false,
  },

  AUTH_003: {
    code:     'AUTH_003',
    title:    'Sign-out paused',
    message:  INTERNAL_MESSAGE,
    action:   'Close the browser tab or clear your cookies if you need to sign out immediately.',
    internal: true,
  },

  // ── Income ────────────────────────────────────────────────────────────────

  INCOME_001: {
    code:     'INCOME_001',
    title:    'Income records unavailable',
    message:  'Your income records are temporarily unavailable.',
    action:   'Reload the page to restore access.',
    internal: false,
  },

  INCOME_002: {
    code:     'INCOME_002',
    title:    'Entry not saved',
    message:  'That entry wasn\'t saved.',
    action:   'Please try submitting again.',
    internal: false,
  },

  INCOME_003: {
    code:     'INCOME_003',
    title:    'Entry still in place',
    message:  'That entry is still in place.',
    action:   'Please try removing it again.',
    internal: false,
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  EXPENSE_001: {
    code:     'EXPENSE_001',
    title:    'Expense records unavailable',
    message:  'Your expense records are temporarily unavailable.',
    action:   'Reload the page to restore access.',
    internal: false,
  },

  EXPENSE_002: {
    code:     'EXPENSE_002',
    title:    'Expense not saved',
    message:  'That entry wasn\'t saved.',
    action:   'Please try submitting again.',
    internal: false,
  },

  EXPENSE_003: {
    code:     'EXPENSE_003',
    title:    'Entry still in place',
    message:  'That entry is still in place.',
    action:   'Please try removing it again.',
    internal: false,
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  DOC_001: {
    code:     'DOC_001',
    title:    'Documents unavailable',
    message:  'Your documents are temporarily unavailable.',
    action:   'Reload to restore access.',
    internal: false,
  },

  DOC_002: {
    code:     'DOC_002',
    title:    'Upload didn\'t complete',
    message:  'Your file couldn\'t be uploaded.',
    action:   'Check your connection and try uploading again.',
    internal: false,
  },

  DOC_003: {
    code:     'DOC_003',
    title:    'Reviewing now',
    message:  INTERNAL_MESSAGE,
    internal: true,
  },

  DOC_004: {
    code:     'DOC_004',
    title:    'Document still in place',
    message:  'That document is still in place.',
    action:   'Please try removing it again.',
    internal: false,
  },

  // ── Messages ──────────────────────────────────────────────────────────────

  MSG_001: {
    code:     'MSG_001',
    title:    'Messages unavailable',
    message:  'Your conversation is temporarily unavailable.',
    action:   'Reload to restore access.',
    internal: false,
  },

  MSG_002: {
    code:     'MSG_002',
    title:    'Message not delivered',
    message:  'Your message wasn\'t delivered.',
    action:   'Please try sending again.',
    internal: false,
  },

  // ── Overview ──────────────────────────────────────────────────────────────

  OVR_001: {
    code:     'OVR_001',
    title:    'Dashboard unavailable',
    message:  'Your dashboard is temporarily unavailable.',
    action:   'Reload the page to restore access.',
    internal: false,
  },

  // ── Accountant notes ──────────────────────────────────────────────────────

  NOTE_001: {
    code:     'NOTE_001',
    title:    'Notes unavailable',
    message:  'Working notes are temporarily unavailable.',
    action:   'Reload the page to restore access.',
    internal: false,
  },

  NOTE_002: {
    code:     'NOTE_002',
    title:    'Note not saved',
    message:  'That note wasn\'t saved.',
    action:   'Please try saving again.',
    internal: false,
  },

  // ── Expense reviews ───────────────────────────────────────────────────────

  REVIEW_001: {
    code:     'REVIEW_001',
    title:    'Reviews unavailable',
    message:  'Expense review data is temporarily unavailable.',
    action:   'Reload the page to restore access.',
    internal: false,
  },

  REVIEW_002: {
    code:     'REVIEW_002',
    title:    'Review not saved',
    message:  'That review decision wasn\'t saved.',
    action:   'Please try saving again.',
    internal: false,
  },

} satisfies Record<string, AppError>

export type ErrorCode = keyof typeof APP_ERRORS
