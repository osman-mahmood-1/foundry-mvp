'use client'

/**
 * app/portal/components/ui/index.tsx
 *
 * Shared UI primitive components for the Foundry portal.
 *
 * Rules:
 * - No data fetching. No Supabase imports. Pure presentation.
 * - All design values come from @/styles/tokens — never hardcoded.
 * - Each component does exactly one thing.
 * - Props are typed explicitly — no `any`, no `style` prop overrides
 *   unless explicitly needed (use the `style` escape hatch sparingly).
 *
 * A senior dev should be able to read any component here
 * in under 30 seconds and understand exactly what it renders.
 */

import React from 'react'
import {
  colours,
  fonts,
  fontSize,
  fontWeight,
  letterSpacing,
  glass,
  radius,
  spacing,
  transition,
  shadows,
} from '@/styles/tokens'


// ─── Panel ────────────────────────────────────────────────────────────────────

interface PanelProps {
  children: React.ReactNode
  padding?: string
  style?: React.CSSProperties
}

/**
 * The standard glassmorphic content card.
 * Wrap any section of content in a Panel.
 */
export function Panel({ children, padding = spacing.panel.padding, style }: PanelProps) {
  return (
    <div style={{
      ...glass.panel,
      padding,
      ...style,
    }}>
      {children}
    </div>
  )
}


// ─── Label ────────────────────────────────────────────────────────────────────

interface LabelProps {
  children: React.ReactNode
}

/**
 * Section label — mono uppercase, muted.
 * Used as the heading above a data group within a panel.
 * e.g. "Recent activity", "Upload documents · 2024-25"
 */
export function Label({ children }: LabelProps) {
  return (
    <div style={{
      fontSize:      fontSize.label,
      color:         colours.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: letterSpacing.label,
      fontFamily:    fonts.mono,
      marginBottom:  '14px',
    }}>
      {children}
    </div>
  )
}


// ─── Spinner ──────────────────────────────────────────────────────────────────

/**
 * Loading spinner. Centered in its container.
 * Sized for inline use inside panels — not a full-page loader.
 */
export function Spinner() {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '48px',
    }}>
      <div style={{
        width:        '24px',
        height:       '24px',
        border:       `2px solid ${colours.borderLight}`,
        borderTop:    `2px solid ${colours.brand}`,
        borderRadius: radius.circle,
        animation:    'spin 0.8s linear infinite',
      }} />
    </div>
  )
}


// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon:      string
  headline:  string
  sub:       string
  action?:   string
  onAction?: () => void
}

/**
 * Empty state for tabs and panels with no data yet.
 * Always provides meaningful copy — never "No data found".
 * The optional action button links directly to resolving the empty state.
 */
export function EmptyState({ icon, headline, sub, action, onAction }: EmptyStateProps) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '56px 32px',
      textAlign:      'center',
    }}>
      <div style={{
        fontSize:     '28px',
        marginBottom: '16px',
        opacity:      0.25,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily:    fonts.serif,
        fontSize:      '18px',
        fontWeight:    fontWeight.medium,
        color:         colours.textPrimary,
        marginBottom:  '8px',
        letterSpacing: letterSpacing.tight,
      }}>
        {headline}
      </div>
      <div style={{
        fontSize:      fontSize.base,
        color:         colours.textMuted,
        lineHeight:    1.6,
        maxWidth:      '280px',
        marginBottom:  action ? '24px' : '0',
      }}>
        {sub}
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            padding:     `9px 20px`,
            background:  colours.brand,
            color:       colours.textInverse,
            border:      'none',
            borderRadius: radius.pill,
            fontSize:    fontSize.sm,
            fontWeight:  fontWeight.medium,
            cursor:      'pointer',
            fontFamily:  fonts.sans,
            letterSpacing: letterSpacing.tight,
            transition:  transition.snap,
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}


// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?:  string
  colour?: string
}

/**
 * Metric display card. Used in the Overview stat row.
 * The value is rendered in JetBrains Mono for numerical clarity.
 */
export function StatCard({ label, value, sub, colour = colours.textPrimary }: StatCardProps) {
  return (
    <Panel padding={spacing.panel.paddingTight}>
      <div style={{
        fontSize:      fontSize.label,
        color:         colours.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: letterSpacing.wider,
        fontFamily:    fonts.mono,
        marginBottom:  '10px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:   fonts.mono,
        fontSize:     '28px',
        fontWeight:   fontWeight.medium,
        color:        colour,
        lineHeight:   1,
        marginBottom: sub ? '6px' : '0',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: fontSize.xs,
          color:    colours.textMuted,
        }}>
          {sub}
        </div>
      )}
    </Panel>
  )
}


// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'income' | 'expense'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const BADGE_STYLES: Record<BadgeVariant, { background: string; color: string }> = {
  success:  { background: colours.allowableLight,       color: colours.allowable },
  warning:  { background: colours.pendingReviewLight,   color: colours.pendingReview },
  danger:   { background: colours.dangerLight,          color: colours.danger },
  info:     { background: colours.infoLight,            color: colours.info },
  neutral:  { background: `rgba(5,28,44,0.05)`,         color: colours.textSecondary },
  income:   { background: colours.incomeLight,          color: colours.income },
  expense:  { background: colours.expenseLight,         color: colours.expense },
}

/**
 * Status and category pill badge.
 * Used for transaction status, allowability, document category, etc.
 */
export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const { background, color } = BADGE_STYLES[variant]
  return (
    <span style={{
      fontSize:      fontSize.xs,
      padding:       '2px 8px',
      background,
      color,
      borderRadius:  radius.pill,
      fontFamily:    fonts.mono,
      display:       'inline-block',
      whiteSpace:    'nowrap' as const,
    }}>
      {children}
    </span>
  )
}


// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children:   React.ReactNode
  onClick?:   () => void
  variant?:   ButtonVariant
  size?:      ButtonSize
  disabled?:  boolean
  fullWidth?: boolean
  type?:      'button' | 'submit'
}

const BUTTON_VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background:  colours.brand,
    color:       colours.textInverse,
    border:      'none',
  },
  secondary: {
    background:  'transparent',
    color:       colours.textSecondary,
    border:      `1px solid ${colours.borderMedium}`,
  },
  ghost: {
    background:  'transparent',
    color:       colours.textMuted,
    border:      'none',
  },
  danger: {
    background:  colours.dangerLight,
    color:       colours.danger,
    border:      `1px solid ${colours.dangerLight}`,
  },
}

const BUTTON_SIZES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '7px 14px', fontSize: fontSize.sm },
  md: { padding: '9px 20px', fontSize: fontSize.base },
  lg: { padding: '14px 28px', fontSize: '14px' },
}

/**
 * Button with primary, secondary, ghost, and danger variants.
 * Always pill-shaped — consistent with the Foundry design language.
 */
export function Button({
  children,
  onClick,
  variant   = 'primary',
  size      = 'md',
  disabled  = false,
  fullWidth = false,
  type      = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BUTTON_VARIANTS[variant],
        ...BUTTON_SIZES[size],
        borderRadius:  radius.pill,
        fontWeight:    fontWeight.medium,
        fontFamily:    fonts.sans,
        cursor:        disabled ? 'not-allowed' : 'pointer',
        opacity:       disabled ? 0.5 : 1,
        transition:    transition.snap,
        width:         fullWidth ? '100%' : 'auto',
        letterSpacing: letterSpacing.tight,
        display:       'inline-block',
      }}
    >
      {children}
    </button>
  )
}


// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps {
  value:        string
  onChange:     (value: string) => void
  placeholder?: string
  type?:        'text' | 'email' | 'number' | 'date' | 'password'
  label?:       string
  disabled?:    boolean
  autoFocus?:   boolean
  onEnter?:     () => void
}

/**
 * Standard form text input.
 * All form inputs across the portal use this component.
 * Focus ring uses the teal accent.
 */
export function Input({
  value,
  onChange,
  placeholder,
  type      = 'text',
  label,
  disabled  = false,
  autoFocus = false,
  onEnter,
}: InputProps) {
  return (
    <div>
      {label && (
        <label style={{
          fontSize:      fontSize.xs,
          color:         colours.textSecondary,
          display:       'block',
          marginBottom:  '6px',
          fontWeight:    fontWeight.medium,
          letterSpacing: '0.02em',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        style={{
          width:        '100%',
          padding:      '10px 12px',
          border:       `1px solid ${colours.borderMedium}`,
          borderRadius: radius.md,
          fontSize:     fontSize.base,
          color:        colours.textPrimary,
          outline:      'none',
          fontFamily:   fonts.sans,
          background:   colours.inputBg,
          boxSizing:    'border-box' as const,
          transition:   transition.snap,
          opacity:      disabled ? 0.6 : 1,
        }}
        onFocus={e  => { e.target.style.borderColor = colours.accent }}
        onBlur={e   => { e.target.style.borderColor = colours.borderMedium }}
      />
    </div>
  )
}


// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value:    string
  onChange: (value: string) => void
  options:  SelectOption[]
  label?:   string
  disabled?: boolean
}

/**
 * Standard form select / dropdown.
 * Consistent with Input styling — same border, radius, focus behaviour.
 */
export function Select({ value, onChange, options, label, disabled = false }: SelectProps) {
  return (
    <div>
      {label && (
        <label style={{
          fontSize:     fontSize.xs,
          color:        colours.textSecondary,
          display:      'block',
          marginBottom: '6px',
          fontWeight:   fontWeight.medium,
        }}>
          {label}
        </label>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        style={{
          width:        '100%',
          padding:      '10px 12px',
          border:       `1px solid ${colours.borderMedium}`,
          borderRadius: radius.md,
          fontSize:     fontSize.base,
          color:        colours.textPrimary,
          outline:      'none',
          fontFamily:   fonts.sans,
          background:   colours.inputBg,
          boxSizing:    'border-box' as const,
          cursor:       disabled ? 'not-allowed' : 'pointer',
          opacity:      disabled ? 0.6 : 1,
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}


// ─── Divider ─────────────────────────────────────────────────────────────────

/**
 * Horizontal rule. Used between sections in panels and the sidebar.
 */
export function Divider() {
  return (
    <div style={{
      height:     '1px',
      background: colours.borderLight,
      margin:     `0 ${spacing.sidebar.padding}`,
    }} />
  )
}


// ─── Formatters (co-located with UI — no Supabase, pure functions) ─────────────

/**
 * Format pence to GBP display string.
 * e.g. 105000 → "£1,050"
 */
export function formatGBP(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style:                 'currency',
    currency:              'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

/**
 * Format ISO date string to readable UK date.
 * e.g. "2025-01-31" → "31 Jan 2025"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

/**
 * Format bytes to human-readable file size.
 * e.g. 1048576 → "1.0 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024)    return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
