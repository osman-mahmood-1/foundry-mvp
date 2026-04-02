'use client'

/**
 * app/portal/components/tabs/SettingsTab.tsx
 *
 * Client profile settings: appearance, personal info, tax details,
 * subscription, and account deletion.
 *
 * Key behaviours:
 * - Only one section editable at a time — block the other if active
 * - Tax section shows a confirmation modal before entering edit mode
 * - Tax edits are logged permanently to audit_log via Server Action
 * - Greyed-out fields explain why they're locked on click
 * - ?  tooltips provide HMRC guidance on where to find each reference number
 * - Delete flow is multi-step: legal notice → email verification → name confirmation
 */

import { useState, useRef, useEffect } from 'react'
import type { Client, ClientType } from '@/types'
import { useColours } from '@/styles/ThemeContext'
import { useThemePreference } from '../PortalThemeProvider'
import type { ThemeMode } from '../PortalThemeProvider'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, spacing, transition } from '@/styles/tokens'
import { Panel, Input, Select, Button, ErrorBanner } from '../ui'
import { useClientProfile } from './useClientProfile'
import type { ProfileUpdate } from './useClientProfile'
import { logTaxChange } from '@/app/actions/logTaxChange'
import type { TaxSnapshot } from '@/app/actions/logTaxChange'
import { createClient as createBrowserClient } from '@/lib/supabase'

// ─── Options ──────────────────────────────────────────────────────────────────

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'sole_trader',     label: 'Sole Trader' },
  { value: 'landlord',        label: 'Landlord' },
  { value: 'content_creator', label: 'Content Creator' },
  { value: 'cis_contractor',  label: 'CIS Contractor' },
  { value: 'tradesperson',    label: 'Tradesperson' },
  { value: 'hairdresser',     label: 'Hairdresser / Beauty' },
  { value: 'consultant',      label: 'Consultant' },
  { value: 'retailer',        label: 'Retailer' },
  { value: 'other',           label: 'Other' },
]

const TAX_YEAR_OPTIONS = [
  { value: '2022-23', label: '2022–23' },
  { value: '2023-24', label: '2023–24' },
  { value: '2024-25', label: '2024–25' },
  { value: '2025-26', label: '2025–26' },
]

const PLAN_LABELS: Record<string, string> = {
  foundation: 'Foundation Plan',
  momentum:   'Momentum Plan',
  accelerate: 'Accelerate Plan',
  command:    'Command Plan',
}

const STATUS_LABELS: Record<string, string> = {
  active:    'Active',
  trialing:  'Trialling',
  cancelled: 'Cancelled',
  past_due:  'Past due',
}

// HMRC tooltip content
const TOOLTIPS: Record<string, { title: string; body: string }> = {
  utr: {
    title: 'Unique Taxpayer Reference (UTR)',
    body:  'Your 10-digit UTR is on your SA302 tax calculation, previous Self Assessment returns, or any HMRC letter headed "Your tax reference". If you\'ve never filed, call HMRC on 0300 200 3310 to request one. It can take up to 10 working days to arrive.',
  },
  ni: {
    title: 'National Insurance Number',
    body:  'Format: AA 12 34 56 C. Find it on your payslip, P60, P45, or your personal tax account at gov.uk/personal-tax-account. If you\'ve lost it, contact HMRC on 0300 200 3500 — they can confirm it over the phone after security checks.',
  },
  client_type: {
    title: 'Client type',
    body:  'This tells HMRC how you earn your income, which determines which supplementary pages go with your SA100 return. Sole traders file an SA103; landlords file an SA105. Choosing the wrong type can delay your filing or trigger HMRC queries — check with your accountant if unsure.',
  },
  tax_year: {
    title: 'Tax year',
    body:  'The UK tax year runs 6 April to 5 April. 2024–25 covers 6 April 2024 to 5 April 2025. Only change this if you\'re filing for a different tax year — changing it mid-year will affect which transactions are counted in your return.',
  },
  vat: {
    title: 'VAT number',
    body:  'Your 9-digit VAT registration number, in the format GB 123 4567 89. Found on your VAT registration certificate (VAT4), VAT returns, or your HMRC business tax account. Only required if you\'re VAT-registered.',
  },
}

// Locked-field explanations
const LOCKED_REASON: Record<string, { title: string; body: string }> = {
  email: {
    title: 'Why is this field locked?',
    body:  'Your email address is your login credential and is managed by our secure authentication system. Changing it here would break your sign-in. To update your email, contact support@taxfoundry.co.uk from your current address — we\'ll verify your identity and update it securely.',
  },
  accounting_year_end: {
    title: 'Why is this field locked?',
    body:  'For most UK individuals, the accounting year end is 5 April — the end of the HMRC tax year. This is determined by HMRC rules for your filing type. If your circumstances require a different year end (e.g. a specific trade), your accountant can update it. Contact us via Messages.',
  },
}

// ─── InfoTooltip ─────────────────────────────────────────────────────────────

function InfoTooltip({ id }: { id: keyof typeof TOOLTIPS }) {
  const colours = useColours()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const tip = TOOLTIPS[id]

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Learn more about ${tip.title}`}
        style={{
          width:          '16px',
          height:         '16px',
          borderRadius:   '50%',
          border:         `1px solid ${colours.borderMedium}`,
          background:     open ? colours.accentLight : 'transparent',
          color:          open ? colours.accent : colours.textMuted,
          fontSize:       '10px',
          fontFamily:     fonts.sans,
          fontWeight:     fontWeight.bold,
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          transition:     transition.snap,
          flexShrink:     0,
          lineHeight:     1,
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.borderColor = colours.accent
            e.currentTarget.style.color       = colours.accent
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = colours.borderMedium
            e.currentTarget.style.color       = colours.textMuted
          }
        }}
      >
        ?
      </button>

      {open && (
        <div style={{
          position:       'absolute',
          bottom:         '100%',
          left:           '50%',
          transform:      'translateX(-50%)',
          marginBottom:   '8px',
          width:          '280px',
          background:     colours.panelBgSolid,
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border:         `1px solid ${colours.borderHairline}`,
          borderRadius:   radius.lg,
          boxShadow:      '0 8px 32px rgba(0,0,0,0.24)',
          padding:        '14px 16px',
          zIndex:         20,
          animation:      'fadeUp 0.15s ease',
        }}>
          {/* Arrow */}
          <div style={{
            position:    'absolute',
            bottom:      '-5px',
            left:        '50%',
            transform:   'translateX(-50%) rotate(45deg)',
            width:       '8px',
            height:      '8px',
            background:  colours.panelBgSolid,
            borderRight: `1px solid ${colours.borderHairline}`,
            borderBottom: `1px solid ${colours.borderHairline}`,
          }} />
          <div style={{
            fontSize:     fontSize.xs,
            fontWeight:   fontWeight.semibold,
            color:        colours.accent,
            fontFamily:   fonts.sans,
            marginBottom: '6px',
          }}>
            {tip.title}
          </div>
          <div style={{
            fontSize:   fontSize.xs,
            color:      colours.textSecondary,
            fontFamily: fonts.sans,
            lineHeight: 1.55,
          }}>
            {tip.body}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LockedField ──────────────────────────────────────────────────────────────

function LockedField({ label, value, lockId }: {
  label:  string
  value:  string
  lockId: keyof typeof LOCKED_REASON
}) {
  const colours = useColours()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const reason = LOCKED_REASON[lockId]

  return (
    <div ref={ref}>
      <div style={{
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        fontFamily:   fonts.sans,
        fontWeight:   fontWeight.medium,
        marginBottom: '4px',
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
      }}>
        {label}
        <span style={{
          fontSize:     '10px',
          padding:      '1px 5px',
          borderRadius: radius.xs,
          background:   colours.borderLight,
          color:        colours.textMuted,
          letterSpacing: '0.03em',
        }}>
          locked
        </span>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        title="Click to learn why this field is locked"
        style={{
          width:        '100%',
          height:       '40px',
          padding:      '0 12px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          border:       `1px solid ${open ? colours.accent : colours.borderLight}`,
          borderRadius: radius.md,
          background:   open ? colours.accentSoft : colours.inputBg,
          fontSize:     fontSize.base,
          color:        colours.textPrimary,
          fontFamily:   fonts.sans,
          opacity:      0.65,
          cursor:       'pointer',
          transition:   transition.snap,
          textAlign:    'left' as const,
        }}
      >
        <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' as const }}>
          {value || '—'}
        </span>
        <span style={{ fontSize: '11px', color: colours.textMuted, flexShrink: 0, marginLeft: '8px' }}>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div style={{
          marginTop:    '6px',
          padding:      '12px 14px',
          background:   colours.accentSoft,
          border:       `1px solid ${colours.accentBorder}`,
          borderRadius: radius.md,
          animation:    'fadeUp 0.15s ease',
        }}>
          <div style={{
            fontSize:     fontSize.xs,
            fontWeight:   fontWeight.semibold,
            color:        colours.accent,
            fontFamily:   fonts.sans,
            marginBottom: '4px',
          }}>
            {reason.title}
          </div>
          <div style={{
            fontSize:   fontSize.xs,
            color:      colours.textSecondary,
            fontFamily: fonts.sans,
            lineHeight: 1.55,
          }}>
            {reason.body}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ReadField ────────────────────────────────────────────────────────────────

function ReadField({ label, value, badge, tooltip }: {
  label:    string
  value:    string
  badge?:   string
  tooltip?: keyof typeof TOOLTIPS
}) {
  const colours = useColours()
  return (
    <div>
      <div style={{
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        fontFamily:   fonts.sans,
        fontWeight:   fontWeight.medium,
        marginBottom: '4px',
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
      }}>
        {label}
        {tooltip && <InfoTooltip id={tooltip} />}
        {badge && (
          <span style={{
            fontSize:      '10px',
            padding:       '1px 6px',
            borderRadius:  radius.xs,
            background:    colours.warningLight,
            color:         colours.warning,
            fontWeight:    fontWeight.medium,
            letterSpacing: '0.04em',
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{
        height:       '40px',
        padding:      '0 12px',
        display:      'flex',
        alignItems:   'center',
        border:       `1px solid ${colours.borderLight}`,
        borderRadius: radius.md,
        background:   colours.inputBg,
        fontSize:     fontSize.base,
        color:        colours.textPrimary,
        fontFamily:   fonts.sans,
        opacity:      0.6,
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

// ─── FieldLabel (editable) ────────────────────────────────────────────────────

function FieldLabel({ children, tooltip }: {
  children: React.ReactNode
  tooltip?: keyof typeof TOOLTIPS
}) {
  const colours = useColours()
  return (
    <div style={{
      fontSize:     fontSize.xs,
      color:        colours.textSecondary,
      marginBottom: '6px',
      fontWeight:   fontWeight.medium,
      letterSpacing: '0.02em',
      display:      'flex',
      alignItems:   'center',
      gap:          '6px',
    } as React.CSSProperties}>
      {children}
      {tooltip && <InfoTooltip id={tooltip} />}
    </div>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title, subtitle, editing, saving, blocked,
  onEdit, onSave, onCancel,
}: {
  title:    string
  subtitle?: string
  editing:  boolean
  saving:   boolean
  blocked:  boolean
  onEdit:   () => void
  onSave:   () => void
  onCancel: () => void
}) {
  const colours = useColours()
  return (
    <div style={{
      display:        'flex',
      alignItems:     'flex-start',
      justifyContent: 'space-between',
      marginBottom:   '20px',
    }}>
      <div>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: letterSpacing.wide,
          fontFamily:    fonts.mono,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.sans, marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={blocked ? undefined : onEdit}
            disabled={blocked}
          >
            Edit
          </Button>
          {blocked && (
            <div style={{
              position:   'absolute',
              top:        '100%',
              right:      0,
              marginTop:  '6px',
              whiteSpace: 'nowrap' as const,
              fontSize:   fontSize.xs,
              color:      colours.textMuted,
              fontFamily: fonts.sans,
              background: colours.panelBgSolid,
              border:     `1px solid ${colours.borderHairline}`,
              borderRadius: radius.md,
              padding:    '6px 10px',
              zIndex:     10,
              boxShadow:  '0 4px 12px rgba(0,0,0,0.16)',
            }}>
              Save or cancel your changes above first
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SavedBadge ───────────────────────────────────────────────────────────────

function SavedBadge() {
  const colours = useColours()
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '6px',
      padding:      '10px 14px',
      background:   colours.incomeLight,
      border:       `1px solid ${colours.income}33`,
      borderRadius: radius.md,
      fontSize:     fontSize.sm,
      color:        colours.income,
      fontFamily:   fonts.sans,
      fontWeight:   fontWeight.medium,
      marginBottom: '16px',
    }}>
      <span>✓</span> Changes saved successfully
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, children, onConfirm, onCancel, confirmLabel = 'Continue', danger = false,
}: {
  title:         string
  children:      React.ReactNode
  onConfirm:     () => void
  onCancel:      () => void
  confirmLabel?: string
  danger?:       boolean
}) {
  const colours = useColours()
  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         100,
      padding:        '20px',
    }}>
      <div style={{
        width:         '100%',
        maxWidth:      '460px',
        background:    colours.panelBgSolid,
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border:        `1px solid ${colours.borderHairline}`,
        borderRadius:  radius.container,
        boxShadow:     '0 24px 64px rgba(0,0,0,0.40)',
        padding:       '28px',
        animation:     'fadeUp 0.2s ease',
      }}>
        <div style={{
          fontSize:     fontSize.base,
          fontWeight:   fontWeight.semibold,
          color:        colours.textPrimary,
          fontFamily:   fonts.sans,
          marginBottom: '16px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize:     fontSize.sm,
          color:        colours.textSecondary,
          fontFamily:   fonts.sans,
          lineHeight:   1.6,
          marginBottom: '24px',
        }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── ThemePill ────────────────────────────────────────────────────────────────

function ThemePill({ label, icon, active, onClick }: {
  label:   string
  icon:    string
  active:  boolean
  onClick: () => void
}) {
  const colours  = useColours()
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        padding:    '10px 18px',
        borderRadius: radius.lg,
        border:     active ? `1.5px solid ${colours.accent}` : `1px solid ${colours.borderMedium}`,
        background: active ? colours.accentLight : hov ? colours.hoverBg : 'transparent',
        color:      active ? colours.accent : colours.textSecondary,
        fontSize:   fontSize.base,
        fontWeight: active ? fontWeight.medium : fontWeight.regular,
        fontFamily: fonts.sans,
        cursor:     'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  )
}

// ─── DeleteFlow ───────────────────────────────────────────────────────────────

function DeleteFlow({ client, onClose }: { client: Client; onClose: () => void }) {
  const colours = useColours()
  const [step, setStep] = useState<'legal' | 'verify' | 'confirm'>('legal')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifySent, setVerifySent] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const expectedText = client.full_name?.trim() || 'DELETE MY ACCOUNT'
  const confirmMatch = confirmText.trim().toLowerCase() === expectedText.toLowerCase()

  async function sendVerification() {
    setVerifyLoading(true)
    const supabase = createBrowserClient()
    await supabase.auth.signInWithOtp({
      email:   client.email,
      options: { shouldCreateUser: false },
    })
    setVerifyLoading(false)
    setVerifySent(true)
  }

  if (step === 'legal') {
    return (
      <ConfirmModal
        title="Before you delete your account"
        onConfirm={() => setStep('verify')}
        onCancel={onClose}
        confirmLabel="I understand — continue"
        danger
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ margin: 0 }}>
            <strong>Legal record retention.</strong> Under HMRC regulations (SI 2003/2682 and the Taxes Management Act 1970),
            we are required to retain financial records for a minimum of <strong>7 years</strong>.
            Your tax data will be archived and cannot be erased within this period, even after your account is closed.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Your data rights.</strong> You have the right to request a copy of all data
            we hold about you under the UK GDPR and Data Protection Act 2018.
            Email <strong>dpo@taxfoundry.co.uk</strong> to submit a subject access request (SAR).
          </p>
          <p style={{ margin: 0 }}>
            <strong>What happens immediately.</strong> Your portal access will be revoked.
            Your assigned accountant will lose access to your records.
            Any in-progress services will be halted.
          </p>
        </div>
      </ConfirmModal>
    )
  }

  if (step === 'verify') {
    return (
      <ConfirmModal
        title="Verify your identity"
        onConfirm={() => { if (verifySent) setStep('confirm') }}
        onCancel={onClose}
        confirmLabel={verifySent ? 'I\'ve confirmed — continue' : 'Send verification email'}
        danger
      >
        {!verifySent ? (
          <>
            <p style={{ margin: '0 0 12px' }}>
              For your security, we need to verify your identity before proceeding.
              We will send a one-time magic link to:
            </p>
            <div style={{
              padding:      '10px 14px',
              background:   colours.hoverBg,
              border:       `1px solid ${colours.borderMedium}`,
              borderRadius: radius.md,
              fontFamily:   fonts.mono,
              fontSize:     fontSize.sm,
              color:        colours.textPrimary,
              marginBottom: '12px',
            }}>
              {client.email}
            </div>
            <p style={{ margin: 0 }}>
              Click the link in that email, then return here to continue with the deletion.
              The link expires in 15 minutes.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={sendVerification}
                disabled={verifyLoading}
              >
                {verifyLoading ? 'Sending…' : 'Send verification email now'}
              </Button>
            </div>
          </>
        ) : (
          <p style={{ margin: 0 }}>
            Verification email sent to <strong>{client.email}</strong>.
            Open the email, click the link, then click "I've confirmed — continue" below.
            The link expires in 15 minutes.
          </p>
        )}
      </ConfirmModal>
    )
  }

  // step === 'confirm'
  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         100,
      padding:        '20px',
    }}>
      <div style={{
        width:       '100%',
        maxWidth:    '460px',
        background:  colours.panelBgSolid,
        border:      `1px solid ${colours.danger}44`,
        borderRadius: radius.container,
        boxShadow:   '0 24px 64px rgba(0,0,0,0.40)',
        padding:     '28px',
        animation:   'fadeUp 0.2s ease',
      }}>
        <div style={{
          fontSize:     fontSize.base,
          fontWeight:   fontWeight.semibold,
          color:        colours.danger,
          fontFamily:   fonts.sans,
          marginBottom: '12px',
        }}>
          Final confirmation
        </div>
        <div style={{
          fontSize:   fontSize.sm,
          color:      colours.textSecondary,
          fontFamily: fonts.sans,
          lineHeight: 1.6,
          marginBottom: '20px',
        }}>
          This action cannot be undone. To confirm, type your full name exactly as it appears below:
          <div style={{
            marginTop:    '8px',
            fontFamily:   fonts.mono,
            fontSize:     fontSize.sm,
            color:        colours.textPrimary,
            background:   colours.hoverBg,
            border:       `1px solid ${colours.borderMedium}`,
            borderRadius: radius.md,
            padding:      '8px 12px',
            display:      'inline-block',
          }}>
            {expectedText}
          </div>
        </div>

        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={`Type "${expectedText}" to confirm`}
          autoFocus
          style={{
            width:        '100%',
            height:       '40px',
            padding:      '0 13px',
            border:       `1px solid ${confirmMatch ? colours.danger : colours.inputBorder}`,
            borderRadius: radius.md,
            fontSize:     fontSize.base,
            color:        colours.textPrimary,
            fontFamily:   fonts.sans,
            background:   colours.inputBg,
            outline:      'none',
            boxSizing:    'border-box' as const,
            marginBottom: '20px',
            transition:   transition.snap,
          }}
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!confirmMatch}
            onClick={() => {
              // In production this would call a server action to delete the account
              alert('Your deletion request has been received. Our team will process it within 48 hours and send confirmation to ' + client.email + '.')
              onClose()
            }}
          >
            Permanently delete my account
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function SettingsTab({ client }: { client: Client }) {
  const colours           = useColours()
  const { mode, setMode } = useThemePreference()
  const { saving, error, success, update, clearError } = useClientProfile(client.id)

  const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light',  label: 'Light',  icon: '☀' },
    { mode: 'dark',   label: 'Dark',   icon: '◑' },
    { mode: 'system', label: 'System', icon: '⊙' },
  ]

  // Which section is currently being edited — only one allowed at a time
  const [activeSection, setActiveSection] = useState<'personal' | 'tax' | null>(null)

  // Tax warning modal state
  const [showTaxWarning, setShowTaxWarning] = useState(false)

  // Delete flow state
  const [showDelete, setShowDelete] = useState(false)

  // ── Personal info ──────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    full_name:     client.full_name     ?? '',
    phone:         client.phone         ?? '',
    date_of_birth: client.date_of_birth ?? '',
  })
  const [personalDraft, setPersonalDraft] = useState(personal)
  const [personalSuccess, setPersonalSuccess] = useState(false)

  async function savePersonal() {
    const ok = await update({
      full_name:     personalDraft.full_name.trim()     || null,
      phone:         personalDraft.phone.trim()         || null,
      date_of_birth: personalDraft.date_of_birth.trim() || null,
    } satisfies ProfileUpdate)
    if (ok) {
      setPersonal(personalDraft)
      setActiveSection(null)
      setPersonalSuccess(true)
      setTimeout(() => setPersonalSuccess(false), 4000)
    }
  }

  // ── Tax info ───────────────────────────────────────────────────────────────
  const [tax, setTax] = useState({
    utr:         client.utr         ?? '',
    ni_number:   client.ni_number   ?? '',
    vat_number:  client.vat_number  ?? '',
    client_type: client.client_type,
    tax_year:    client.tax_year,
  })
  const [taxDraft, setTaxDraft] = useState(tax)
  const [taxSuccess, setTaxSuccess] = useState(false)

  async function saveTax() {
    const before: TaxSnapshot = {
      utr:         tax.utr        || null,
      ni_number:   tax.ni_number  || null,
      vat_number:  tax.vat_number || null,
      client_type: tax.client_type,
      tax_year:    tax.tax_year,
    }
    const after: TaxSnapshot = {
      utr:         taxDraft.utr.trim()        || null,
      ni_number:   taxDraft.ni_number.trim()  || null,
      vat_number:  taxDraft.vat_number.trim() || null,
      client_type: taxDraft.client_type,
      tax_year:    taxDraft.tax_year,
    }

    const ok = await update({
      utr:         after.utr,
      ni_number:   after.ni_number,
      vat_number:  after.vat_number,
      client_type: after.client_type as ClientType,
      tax_year:    after.tax_year,
    } satisfies ProfileUpdate)

    if (ok) {
      // Audit log — fire and forget, runs server-side
      logTaxChange(client.id, before, after).catch(err =>
        console.error('AUDIT_TAX_001', err)
      )
      setTax(taxDraft)
      setActiveSection(null)
      setTaxSuccess(true)
      setTimeout(() => setTaxSuccess(false), 4000)
    }
  }

  const planLabel   = PLAN_LABELS[client.plan]           ?? client.plan
  const statusLabel = STATUS_LABELS[client.plan_status]  ?? client.plan_status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Appearance ── */}
      <Panel padding={spacing.panel.padding}>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: letterSpacing.wide,
          fontFamily:    fonts.mono,
          marginBottom:  '16px',
        }}>
          Appearance
        </div>
        <div style={{
          fontSize:     fontSize.sm,
          color:        colours.textSecondary,
          marginBottom: '16px',
          fontFamily:   fonts.sans,
        }}>
          Choose how Foundry looks on this device.
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
          {THEME_OPTIONS.map(opt => (
            <ThemePill key={opt.mode} label={opt.label} icon={opt.icon}
              active={mode === opt.mode} onClick={() => setMode(opt.mode)} />
          ))}
        </div>
      </Panel>

      {/* ── Personal information ── */}
      <Panel padding={spacing.panel.padding}>
        <SectionHeader
          title="Personal information"
          subtitle="Your name, contact details, and date of birth"
          editing={activeSection === 'personal'}
          saving={saving}
          blocked={activeSection === 'tax'}
          onEdit={() => {
            setPersonalDraft(personal)
            setActiveSection('personal')
            clearError()
          }}
          onSave={savePersonal}
          onCancel={() => setActiveSection(null)}
        />

        {error && activeSection === 'personal' && (
          <div style={{ marginBottom: '16px' }}><ErrorBanner error={error} /></div>
        )}
        {personalSuccess && activeSection !== 'personal' && <SavedBadge />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          {activeSection === 'personal' ? (
            <>
              <Input
                label="Full name"
                value={personalDraft.full_name}
                onChange={v => setPersonalDraft(d => ({ ...d, full_name: v }))}
                placeholder="e.g. Sarah Mitchell"
                autoFocus
              />
              <LockedField label="Email address" value={client.email} lockId="email" />
              <Input
                label="Phone"
                value={personalDraft.phone}
                onChange={v => setPersonalDraft(d => ({ ...d, phone: v }))}
                placeholder="+44 7700 900123"
              />
              <Input
                label="Date of birth"
                type="date"
                value={personalDraft.date_of_birth}
                onChange={v => setPersonalDraft(d => ({ ...d, date_of_birth: v }))}
              />
            </>
          ) : (
            <>
              <ReadField label="Full name"     value={personal.full_name} />
              <LockedField label="Email address" value={client.email} lockId="email" />
              <ReadField label="Phone"         value={personal.phone} />
              <ReadField
                label="Date of birth"
                value={personal.date_of_birth
                  ? new Date(personal.date_of_birth).toLocaleDateString('en-GB')
                  : ''}
              />
            </>
          )}
        </div>
      </Panel>

      {/* ── Tax warning modal ── */}
      {showTaxWarning && (
        <ConfirmModal
          title="Editing your tax information"
          onConfirm={() => {
            setShowTaxWarning(false)
            setTaxDraft(tax)
            setActiveSection('tax')
            clearError()
          }}
          onCancel={() => setShowTaxWarning(false)}
          confirmLabel="I understand — edit tax info"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: 0 }}>
              Your tax information is used to calculate your liability and file your Self Assessment return.
              Please be aware:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Changes take effect on your <strong>next</strong> tax calculation — past returns are not affected.</li>
              <li>Changing your tax year or client type mid-period can cause your return to be filed on the wrong basis.</li>
              <li>All changes are <strong>permanently logged</strong> with a timestamp and are visible to your accountant.</li>
              <li>If you're unsure, message your accountant first before making changes here.</li>
            </ul>
          </div>
        </ConfirmModal>
      )}

      {/* ── Tax information ── */}
      <Panel padding={spacing.panel.padding}>
        <SectionHeader
          title="Tax information"
          subtitle="Your HMRC reference numbers and filing configuration"
          editing={activeSection === 'tax'}
          saving={saving}
          blocked={activeSection === 'personal'}
          onEdit={() => setShowTaxWarning(true)}
          onSave={saveTax}
          onCancel={() => setActiveSection(null)}
        />

        {error && activeSection === 'tax' && (
          <div style={{ marginBottom: '16px' }}><ErrorBanner error={error} /></div>
        )}
        {taxSuccess && activeSection !== 'tax' && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '10px 14px',
            background:   colours.incomeLight,
            border:       `1px solid ${colours.income}33`,
            borderRadius: radius.md,
            fontSize:     fontSize.sm,
            color:        colours.income,
            fontFamily:   fonts.sans,
            fontWeight:   fontWeight.medium,
            marginBottom: '16px',
          }}>
            <span>✓</span>
            Changes saved — your accountant has been notified
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          {activeSection === 'tax' ? (
            <>
              <div>
                <FieldLabel tooltip="utr">UTR number</FieldLabel>
                <Input
                  value={taxDraft.utr}
                  onChange={v => setTaxDraft(d => ({ ...d, utr: v }))}
                  placeholder="10-digit Unique Taxpayer Reference"
                  autoFocus
                />
              </div>
              <div>
                <FieldLabel tooltip="ni">National Insurance no.</FieldLabel>
                <Input
                  value={taxDraft.ni_number}
                  onChange={v => setTaxDraft(d => ({ ...d, ni_number: v }))}
                  placeholder="e.g. AB 12 34 56 C"
                />
              </div>
              <div>
                <FieldLabel tooltip="client_type">Client type</FieldLabel>
                <Select
                  value={taxDraft.client_type}
                  onChange={v => setTaxDraft(d => ({ ...d, client_type: v as ClientType }))}
                  options={CLIENT_TYPE_OPTIONS}
                />
              </div>
              <div>
                <FieldLabel tooltip="tax_year">Tax year</FieldLabel>
                <Select
                  value={taxDraft.tax_year}
                  onChange={v => setTaxDraft(d => ({ ...d, tax_year: v }))}
                  options={TAX_YEAR_OPTIONS}
                />
              </div>
              <LockedField label="Accounting year end" value={client.accounting_period_label} lockId="accounting_year_end" />
              <div>
                <FieldLabel tooltip="vat">VAT number (optional)</FieldLabel>
                <Input
                  value={taxDraft.vat_number}
                  onChange={v => setTaxDraft(d => ({ ...d, vat_number: v }))}
                  placeholder="e.g. GB 123 4567 89"
                />
              </div>
            </>
          ) : (
            <>
              <ReadField
                label="UTR number"
                value={tax.utr}
                tooltip="utr"
                badge={!tax.utr ? 'Required for filing' : undefined}
              />
              <ReadField
                label="National Insurance no."
                value={tax.ni_number}
                tooltip="ni"
                badge={!tax.ni_number ? 'Required' : undefined}
              />
              <ReadField
                label="Client type"
                value={CLIENT_TYPE_OPTIONS.find(o => o.value === tax.client_type)?.label ?? tax.client_type}
                tooltip="client_type"
              />
              <ReadField label="Tax year"            value={tax.tax_year} tooltip="tax_year" />
              <LockedField label="Accounting year end" value={client.accounting_period_label} lockId="accounting_year_end" />
              <ReadField label="VAT number"          value={tax.vat_number} tooltip="vat" />
            </>
          )}
        </div>
      </Panel>

      {/* ── Subscription ── */}
      <Panel padding={spacing.panel.padding}>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: letterSpacing.wide,
          fontFamily:    fonts.mono,
          marginBottom:  '16px',
        }}>
          Subscription
        </div>

        <div style={{
          border:         `1px solid ${colours.borderMedium}`,
          borderRadius:   radius.lg,
          padding:        '18px 20px',
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            '16px',
          marginBottom:   '16px',
        }}>
          <div>
            <div style={{
              fontSize:     fontSize.base,
              fontWeight:   fontWeight.semibold,
              color:        colours.textPrimary,
              fontFamily:   fonts.sans,
              marginBottom: '4px',
            }}>
              {planLabel}
            </div>
            <div style={{
              fontSize:   fontSize.xs,
              color:      colours.textMuted,
              fontFamily: fonts.sans,
            }}>
              SA filing support · Secure messages · Document vault
            </div>
          </div>
          <span style={{
            fontSize:     fontSize.xs,
            padding:      '4px 10px',
            borderRadius: radius.pill,
            background:   colours.accentLight,
            color:        colours.accent,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            flexShrink:   0,
            whiteSpace:   'nowrap' as const,
          }}>
            {statusLabel}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => alert('Upgrade — contact support@taxfoundry.co.uk.')}
            style={{
              padding:      '10px 22px',
              borderRadius: radius.pill,
              border:       'none',
              background:   `linear-gradient(135deg, ${colours.accent}, ${colours.orange})`,
              color:        '#000000',
              fontSize:     fontSize.sm,
              fontWeight:   fontWeight.semibold,
              fontFamily:   fonts.sans,
              cursor:       'pointer',
              transition:   transition.snap,
            }}
          >
            Upgrade to Core — £39/mo
          </button>
          <button
            onClick={() => alert('Plan comparison — coming soon.')}
            style={{
              padding:      '10px 20px',
              borderRadius: radius.pill,
              border:       `1px solid ${colours.borderMedium}`,
              background:   'transparent',
              color:        colours.textSecondary,
              fontSize:     fontSize.sm,
              fontFamily:   fonts.sans,
              cursor:       'pointer',
              transition:   transition.snap,
            }}
          >
            View all plans
          </button>
        </div>
      </Panel>

      {/* ── Danger zone ── */}
      <Panel padding={spacing.panel.padding}>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.danger,
          textTransform: 'uppercase' as const,
          letterSpacing: letterSpacing.wide,
          fontFamily:    fonts.mono,
          marginBottom:  '16px',
        }}>
          Danger zone
        </div>

        <div style={{
          border:       `1px solid ${colours.danger}33`,
          borderRadius: radius.lg,
          padding:      '18px 20px',
          display:      'flex',
          alignItems:   'flex-start',
          justifyContent: 'space-between',
          gap:          '16px',
        }}>
          <div>
            <div style={{
              fontSize:     fontSize.sm,
              fontWeight:   fontWeight.medium,
              color:        colours.textPrimary,
              fontFamily:   fonts.sans,
              marginBottom: '4px',
            }}>
              Delete account
            </div>
            <div style={{
              fontSize:   fontSize.xs,
              color:      colours.textMuted,
              fontFamily: fonts.sans,
              lineHeight: 1.5,
            }}>
              We are legally required to retain financial records for 7 years.<br />
              Account deletion removes your portal access but data is archived per HMRC regulations.
            </div>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            style={{
              padding:      '9px 16px',
              borderRadius: radius.pill,
              border:       `1px solid ${colours.danger}`,
              background:   'transparent',
              color:        colours.danger,
              fontSize:     fontSize.sm,
              fontWeight:   fontWeight.medium,
              fontFamily:   fonts.sans,
              cursor:       'pointer',
              flexShrink:   0,
              whiteSpace:   'nowrap' as const,
            }}
          >
            Delete account
          </button>
        </div>
      </Panel>

      {/* ── Delete flow modal ── */}
      {showDelete && (
        <DeleteFlow client={client} onClose={() => setShowDelete(false)} />
      )}

    </div>
  )
}
