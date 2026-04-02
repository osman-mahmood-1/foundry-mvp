'use client'

/**
 * app/portal/components/ui/index.tsx
 *
 * Shared UI primitive components for the Foundry portal.
 *
 * Rules:
 * - No data fetching. No Supabase imports. Pure presentation.
 * - All design values from @/styles/tokens — never hardcoded.
 * - Theme-aware via useColours() / useThemeMode() where needed.
 * - Each component does exactly one thing.
 *
 * Authority: lotech-dashboard-v9.html mockup — no other source.
 */

import React, { useState, Component } from 'react'
import {
  colours as staticColours,
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
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import type { AppError } from '@/lib/errors'


// ─── ErrorBanner ──────────────────────────────────────────────────────────────

export function ErrorBanner({ error }: { error: AppError }) {
  const colours = useColours()
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(error.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const borderColour = error.internal ? colours.info          : colours.pendingReview
  const bgColour     = error.internal ? colours.infoLight     : colours.pendingReviewLight
  const codeColour   = error.internal ? colours.info          : colours.pendingReview

  return (
    <div style={{
      background:   bgColour,
      border:       `1px solid ${borderColour}`,
      borderLeft:   `3px solid ${borderColour}`,
      borderRadius: radius.md,
      padding:      '12px 14px',
      display:      'flex',
      alignItems:   'flex-start',
      gap:          '12px',
      justifyContent: 'space-between',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily:   fonts.sans,
          fontWeight:   fontWeight.semibold,
          fontSize:     fontSize.sm,
          color:        colours.textPrimary,
          marginBottom: '2px',
        }}>
          {error.title}
        </div>
        <div style={{
          fontFamily: fonts.sans,
          fontSize:   fontSize.sm,
          color:      colours.textSecondary,
          lineHeight: 1.5,
        }}>
          {error.message}
          {error.action && (
            <span style={{ color: colours.textMuted }}> {error.action}</span>
          )}
        </div>
      </div>

      <button
        onClick={copyCode}
        title="Copy reference code"
        style={{
          fontFamily:    fonts.sans,
          fontSize:      '10px',
          letterSpacing: '0.04em',
          color:         copied ? colours.allowable : codeColour,
          background:    'transparent',
          border:        `1px solid ${copied ? colours.allowable : borderColour}`,
          borderRadius:  radius.sm,
          padding:       '3px 8px',
          cursor:        'pointer',
          flexShrink:    0,
          transition:    transition.snap,
          whiteSpace:    'nowrap' as const,
          alignSelf:     'flex-start',
        }}
      >
        {copied ? '✓ copied' : error.code}
      </button>
    </div>
  )
}


// ─── TabErrorBoundary ─────────────────────────────────────────────────────────

interface TabErrorBoundaryState {
  caught: boolean
  code:   string
}

export class TabErrorBoundary extends Component<
  { children: React.ReactNode },
  TabErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { caught: false, code: '' }
  }

  static getDerivedStateFromError(error: unknown): TabErrorBoundaryState {
    const msg  = error instanceof Error ? error.message : String(error)
    const code = `UI-${Math.abs(
      msg.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0),
    ).toString(16).toUpperCase().slice(0, 6)}`
    return { caught: true, code }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(this.state.code, error, info.componentStack)
  }

  render() {
    if (!this.state.caught) return this.props.children

    // Class components cannot use hooks; use static light colours as fallback
    const c = staticColours
    return (
      <div style={{
        ...glass.panel('light'),
        padding:        '48px 36px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '320px',
        textAlign:      'center',
        gap:            '12px',
      }}>
        <div style={{ fontSize: '22px', opacity: 0.2 }}>◈</div>
        <div style={{
          fontFamily: fonts.sans,
          fontSize:   '18px',
          fontWeight: fontWeight.semibold,
          color:      c.textPrimary,
        }}>
          This section hit a snag.
        </div>
        <div style={{
          fontSize:   fontSize.sm,
          color:      c.textMuted,
          lineHeight: 1.6,
          maxWidth:   '300px',
        }}>
          We've spotted a hiccup on our end. We're reviewing it and will have this resolved shortly.
          Switch to another tab to continue, or reload the page.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop:     '8px',
            padding:       '8px 16px',
            background:    'transparent',
            border:        `1px solid ${c.borderMedium}`,
            borderRadius:  radius.md,
            fontSize:      '13.5px',
            color:         c.textSecondary,
            fontFamily:    fonts.sans,
            cursor:        'pointer',
            transition:    transition.snap,
          }}
        >
          Reload page
        </button>
        <div style={{
          fontFamily:    fonts.sans,
          fontSize:      '10px',
          color:         c.textMuted,
          letterSpacing: '0.08em',
          opacity:       0.6,
        }}>
          {this.state.code}
        </div>
      </div>
    )
  }
}


// ─── Panel ────────────────────────────────────────────────────────────────────

interface PanelProps {
  children: React.ReactNode
  padding?: string
  style?:   React.CSSProperties
}

/**
 * Standard glassmorphic content card.
 * Uses glass.card styles (smaller card-level glass, 14px radius).
 */
export function Panel({ children, padding = spacing.panel.padding, style }: PanelProps) {
  const mode = useThemeMode()
  return (
    <div style={{
      ...glass.card(mode),
      padding,
      ...style,
    }}>
      {children}
    </div>
  )
}


// ─── Label ────────────────────────────────────────────────────────────────────

interface LabelProps { children: React.ReactNode }

/** Uppercase section label. */
export function Label({ children }: LabelProps) {
  const colours = useColours()
  return (
    <div style={{
      fontSize:      fontSize.label,
      color:         colours.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: letterSpacing.label,
      fontFamily:    fonts.sans,
      fontWeight:    fontWeight.semibold,
      marginBottom:  '14px',
    }}>
      {children}
    </div>
  )
}


// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner() {
  const colours = useColours()
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
        border:       `2px solid ${colours.borderHairline}`,
        borderTop:    `2px solid ${colours.accent}`,
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

export function EmptyState({ icon, headline, sub, action, onAction }: EmptyStateProps) {
  const colours = useColours()
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
        fontFamily:    fonts.sans,
        fontSize:      '18px',
        fontWeight:    fontWeight.bold,
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
          className="cta-btn"
          style={{
            padding:      '8px 20px',
            background:   colours.cta,
            color:        colours.ctaText,
            border:       'none',
            borderRadius: radius.md,
            fontSize:     '13.5px',
            fontWeight:   fontWeight.semibold,
            cursor:       'pointer',
            fontFamily:   fonts.sans,
            boxShadow:    'none',
            transition:   transition.snap,
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
  label:   string
  value:   string
  sub?:    string
  colour?: string
}

export function StatCard({ label, value, sub, colour }: StatCardProps) {
  const colours = useColours()
  const mode    = useThemeMode()
  return (
    <div style={{
      ...glass.card(mode),
      padding: spacing.panel.paddingTight,
    }}>
      <div style={{
        fontSize:      fontSize.label,
        color:         colours.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: letterSpacing.label,
        fontFamily:    fonts.sans,
        fontWeight:    fontWeight.semibold,
        marginBottom:  '10px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:   fonts.sans,
        fontSize:     '28px',
        fontWeight:   fontWeight.medium,
        color:        colour ?? colours.textPrimary,
        lineHeight:   1,
        letterSpacing: letterSpacing.tight,
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
    </div>
  )
}


// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'income' | 'expense'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const colours = useColours()

  const BADGE_STYLES: Record<BadgeVariant, { background: string; color: string }> = {
    success:  { background: colours.allowableLight,     color: colours.allowable },
    warning:  { background: colours.warningLight,       color: colours.warning },
    danger:   { background: colours.dangerLight,        color: colours.danger },
    info:     { background: colours.infoLight,          color: colours.info },
    neutral:  { background: colours.borderHairline,     color: colours.textSecondary },
    income:   { background: colours.incomeLight,        color: colours.income },
    expense:  { background: colours.expenseLight,       color: colours.expense },
  }

  const { background, color } = BADGE_STYLES[variant]
  return (
    <span style={{
      fontSize:      fontSize.xs,
      fontWeight:    fontWeight.semibold,
      padding:       '2px 8px',
      background,
      color,
      borderRadius:  radius.xs,
      fontFamily:    fonts.sans,
      display:       'inline-block',
      whiteSpace:    'nowrap' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
    }}>
      {children}
    </span>
  )
}


// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tint'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children:   React.ReactNode
  onClick?:   () => void
  variant?:   ButtonVariant
  size?:      ButtonSize
  disabled?:  boolean
  fullWidth?: boolean
  type?:      'button' | 'submit'
  /** Used by tint variant — marks the button as the active/selected state */
  active?:    boolean
}

/**
 * Button variants:
 *   primary   = btn-cta: deep navy gradient, white text, radius-md, semibold
 *   secondary = btn-ghost with subtle tint bg
 *   ghost     = btn-ghost: transparent, hairline border at rest
 *   danger    = danger tint background
 *   tint      = btn-tint: toggle groups and tertiary controls (active/inactive)
 */
export function Button({
  children,
  onClick,
  variant   = 'primary',
  size      = 'md',
  disabled  = false,
  fullWidth = false,
  type      = 'button',
  active    = false,
}: ButtonProps) {
  const colours            = useColours()
  const mode               = useThemeMode()
  const [hovered, setHov] = useState(false)

  function variantStyles(): React.CSSProperties {
    switch (variant) {
      case 'primary':
        return {
          padding:    '8px 20px',
          background: colours.cta,
          color:      colours.ctaText,
          border:     'none',
          fontWeight: fontWeight.semibold,
          boxShadow:  hovered ? `0 6px 24px ${colours.ctaGlow}` : 'none',
          transform:  hovered && !disabled ? 'translateY(-1px)' : 'none',
        }
      case 'secondary':
        return {
          padding:    '8px 16px',
          background: hovered ? colours.accentSoft : colours.simpleBg,
          color:      hovered ? colours.textPrimary : colours.textSecondary,
          border:     hovered ? '1px solid transparent' : `1px solid ${colours.borderHairline}`,
          fontWeight: fontWeight.regular,
        }
      case 'ghost':
        return {
          padding:    '8px 16px',
          background: hovered
            ? (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)')
            : 'transparent',
          color: hovered
            ? (mode === 'dark' ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.80)')
            : (mode === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.55)'),
          border: hovered
            ? (mode === 'dark' ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(15,23,42,0.18)')
            : (mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.12)'),
          fontWeight: fontWeight.regular,
        }
      case 'tint':
        if (active) {
          return {
            padding:    '8px 16px',
            background: mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(30,64,175,0.08)',
            border:     mode === 'dark' ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(30,64,175,0.20)',
            color:      mode === 'dark' ? 'rgba(255,255,255,0.85)' : '#1e40af',
            fontWeight: fontWeight.medium,
          }
        }
        return {
          padding:    '8px 16px',
          background: hovered
            ? (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)')
            : (mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'),
          border: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.08)',
          color:  mode === 'dark' ? 'rgba(255,255,255,0.40)' : 'rgba(15,23,42,0.45)',
          fontWeight: fontWeight.regular,
        }
      case 'danger':
        return {
          padding:    '8px 16px',
          background: colours.dangerLight,
          color:      colours.danger,
          border:     'none',
          fontWeight: fontWeight.regular,
        }
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={variant === 'primary' ? 'cta-btn' : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...variantStyles(),
        borderRadius:  radius.md,
        fontSize:      '13.5px',
        fontFamily:    fonts.sans,
        cursor:        disabled ? 'not-allowed' : 'pointer',
        opacity:       disabled ? 0.5 : 1,
        transition:    transition.snap,
        width:         fullWidth ? '100%' : 'auto',
        letterSpacing: letterSpacing.tight2,
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '7px',
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
  const colours = useColours()
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
          padding:      '9px 13px',
          border:       `1px solid ${colours.inputBorder}`,
          borderRadius: radius.md,
          fontSize:     '13.5px',
          color:        colours.textPrimary,
          outline:      'none',
          fontFamily:   fonts.sans,
          background:   colours.inputBg,
          boxSizing:    'border-box' as const,
          transition:   transition.snap,
          opacity:      disabled ? 0.6 : 1,
        }}
        onFocus={e => {
          e.target.style.borderColor = colours.accentBorder
          e.target.style.background  = colours.accentSoft
          e.target.style.boxShadow   = `0 0 0 3px ${colours.accentLight}`
        }}
        onBlur={e => {
          e.target.style.borderColor = colours.inputBorder
          e.target.style.background  = colours.inputBg
          e.target.style.boxShadow   = 'none'
        }}
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
  value:     string
  onChange:  (value: string) => void
  options:   SelectOption[]
  label?:    string
  disabled?: boolean
}

export function Select({ value, onChange, options, label, disabled = false }: SelectProps) {
  const colours = useColours()
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
          padding:      '9px 32px 9px 13px',
          border:       `1px solid ${colours.inputBorder}`,
          borderRadius: radius.md,
          fontSize:     '13.5px',
          color:        colours.textPrimary,
          outline:      'none',
          fontFamily:   fonts.sans,
          background:   colours.inputBg,
          boxSizing:    'border-box' as const,
          cursor:       disabled ? 'not-allowed' : 'pointer',
          opacity:      disabled ? 0.6 : 1,
          appearance:   'none' as const,
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

export function Divider() {
  const colours = useColours()
  return (
    <div style={{
      height:     '1px',
      background: colours.borderHairline,
      margin:     `0`,
    }} />
  )
}


// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style:                 'currency',
    currency:              'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)    return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
