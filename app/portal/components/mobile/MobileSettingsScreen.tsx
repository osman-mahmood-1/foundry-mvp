'use client'

/**
 * app/portal/components/mobile/MobileSettingsScreen.tsx
 *
 * Full-screen settings overlay for mobile — replaces the old bottom sheet.
 * Mirrors every section from SettingsTab.tsx (desktop) but with:
 *   - 1-column field layout
 *   - Inline info / locked-field explanations (no fixed-positioned popups)
 *   - Save / Cancel as a full-width sticky bar while editing
 *   - Same hooks, same server actions, same Supabase writes as desktop
 */

import { useState, useEffect }       from 'react'
import { createPortal }               from 'react-dom'
import type { Client, ClientType }    from '@/types'
import { useColours, useThemeMode }   from '@/styles/ThemeContext'
import { useThemePreference }         from '../PortalThemeProvider'
import type { ThemeMode }             from '../PortalThemeProvider'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, spacing, transition } from '@/styles/tokens'
import { Input, Select, Button, ErrorBanner } from '../ui'
import { useClientProfile }           from '../tabs/useClientProfile'
import type { ProfileUpdate }         from '../tabs/useClientProfile'
import { logTaxChange }               from '@/app/actions/logTaxChange'
import type { TaxSnapshot }           from '@/app/actions/logTaxChange'
import { createClient as createBrowserClient } from '@/lib/supabase'

// ─── Static data (mirrors SettingsTab.tsx) ────────────────────────────────────

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

const TOOLTIPS: Record<string, { title: string; body: string }> = {
  utr: {
    title: 'Unique Taxpayer Reference (UTR)',
    body:  "Your 10-digit UTR appears on your SA302, previous Self Assessment returns, or any HMRC correspondence. Not sure where to find yours? Message us in the app and we'll help.",
  },
  ni: {
    title: 'National Insurance Number',
    body:  "Format: AA 12 34 56 C. Find it on your payslip, P60, P45, or at gov.uk/personal-tax-account. Can't locate it? Message us in the app and we'll assist.",
  },
  client_type: {
    title: 'Client type',
    body:  "This determines which supplementary pages accompany your SA100 return. Not sure which applies to you? Message us in the app and we'll confirm.",
  },
  tax_year: {
    title: 'Tax year',
    body:  "The UK tax year runs 6 April to 5 April. 2024–25 covers 6 April 2024 to 5 April 2025. Only change this if you're filing for a different tax year — changing it mid-year will affect which transactions are counted in your return.",
  },
  vat: {
    title: 'VAT number',
    body:  'Your 9-digit VAT registration number, in the format GB 123 4567 89. Found on your VAT registration certificate (VAT4), VAT returns, or your HMRC business tax account. Only required if you\'re VAT-registered.',
  },
}

const LOCKED_REASON: Record<string, { title: string; body: string }> = {
  email: {
    title: 'Why is this field locked?',
    body:  "Your email is your login credential. To change it, message us in the app from your current account and we'll update it securely.",
  },
  accounting_year_end: {
    title: 'Why is this field locked?',
    body:  "For most individuals this is 5 April — the end of the UK tax year. If your circumstances require a different year end, message us in the app and your accountant can update it.",
  },
}

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * InfoSheet — bottom-sheet dialog for tooltip / locked-field explanations.
 * Renders as position:fixed so it escapes SectionCard's overflow:hidden.
 */
function InfoSheet({
  title, body, onClose,
}: { title: string; body: React.ReactNode; onClose: () => void }) {
  const colours = useColours()
  return (
    <div
      onClick={onClose}
      style={{
        position:             'fixed',
        inset:                0,
        zIndex:               300,
        background:           'rgba(0,0,0,0.5)',
        backdropFilter:       'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display:              'flex',
        alignItems:           'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:         '100%',
          background:    colours.panelBgSolid,
          borderRadius:  `${radius.lg} ${radius.lg} 0 0`,
          padding:       '12px 20px calc(32px + env(safe-area-inset-bottom, 0px))',
          borderTop:     `1px solid ${colours.borderHairline}`,
          animation:     'fadeIn 0.18s ease',
        }}
      >
        {/* drag handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: colours.borderMedium, margin: '0 auto 20px' }} />
        <div style={{
          fontFamily:   fonts.sans,
          fontSize:     '15px',
          fontWeight:   fontWeight.semibold,
          color:        colours.textPrimary,
          marginBottom: '10px',
          lineHeight:   1.3,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily:   fonts.sans,
          fontSize:     fontSize.sm,
          color:        colours.textSecondary,
          lineHeight:   1.65,
          marginBottom: '22px',
        }}>
          {body}
        </div>
        <button
          onClick={onClose}
          style={{
            width:        '100%',
            height:       '48px',
            borderRadius: radius.md,
            border:       `1px solid ${colours.borderMedium}`,
            background:   colours.hoverBg,
            color:        colours.textPrimary,
            fontFamily:   fonts.sans,
            fontSize:     '15px',
            fontWeight:   fontWeight.medium,
            cursor:       'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

/** ? button — opens an InfoSheet dialog. */
function InfoTip({ id }: { id: keyof typeof TOOLTIPS }) {
  const colours = useColours()
  const [open, setOpen] = useState(false)
  const tip = TOOLTIPS[id]
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Info: ${tip.title}`}
        style={{
          width:          '16px',
          height:         '16px',
          borderRadius:   '50%',
          border:         `1px solid ${colours.borderMedium}`,
          background:     'transparent',
          color:          colours.textMuted,
          fontSize:       '10px',
          fontFamily:     fonts.sans,
          fontWeight:     fontWeight.bold,
          cursor:         'pointer',
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          lineHeight:     1,
          verticalAlign:  'middle',
        }}
      >
        ?
      </button>
      {open && <InfoSheet title={tip.title} body={tip.body} onClose={() => setOpen(false)} />}
    </>
  )
}

/** Read-only display field. */
function ReadField({ label, value, badge, tip }: {
  label:  string
  value:  string
  badge?: string
  tip?:   keyof typeof TOOLTIPS
}) {
  const colours = useColours()
  return (
    <div>
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        marginBottom: '5px',
        fontSize:     fontSize.xs,
        fontWeight:   fontWeight.medium,
        color:        colours.textMuted,
        fontFamily:   fonts.sans,
        flexWrap:     'wrap' as const,
      }}>
        {label}
        {tip && <InfoTip id={tip} />}
        {badge && (
          <span style={{
            fontSize:     '10px',
            padding:      '1px 6px',
            borderRadius: radius.xs,
            background:   colours.warningLight,
            color:        colours.warning,
            fontWeight:   fontWeight.medium,
            letterSpacing:'0.04em',
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{
        minHeight:    '44px',
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

/** Locked field — tap the lock icon to open an explanation sheet. */
function LockedField({ label, value, lockId }: {
  label:  string
  value:  string
  lockId: keyof typeof LOCKED_REASON
}) {
  const colours = useColours()
  const [open, setOpen] = useState(false)
  const reason = LOCKED_REASON[lockId]
  return (
    <div>
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        marginBottom: '5px',
        fontSize:     fontSize.xs,
        fontWeight:   fontWeight.medium,
        color:        colours.textMuted,
        fontFamily:   fonts.sans,
      }}>
        {label}
        <button
          onClick={() => setOpen(true)}
          style={{
            fontSize:     '10px',
            padding:      '1px 6px',
            borderRadius: radius.xs,
            background:   colours.borderLight,
            color:        colours.textMuted,
            border:       'none',
            cursor:       'pointer',
            fontFamily:   fonts.sans,
            letterSpacing:'0.03em',
          }}
        >
          locked ›
        </button>
      </div>
      <div style={{
        minHeight:    '44px',
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
      {open && (
        <InfoSheet
          title={reason.title}
          body={reason.body}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

/** Section card wrapper. No overflow:hidden — lets InfoSheet overlays escape. */
function SectionCard({ children }: { children: React.ReactNode }) {
  const colours = useColours()
  return (
    <div style={{
      background:   colours.cardBg,
      border:       `1px solid ${colours.cardBorder}`,
      borderRadius: radius.lg,
      padding:      '20px',
    }}>
      {children}
    </div>
  )
}

/** Section label with optional subtitle. */
function SectionLabel({
  children, subtitle, danger,
}: {
  children: React.ReactNode
  subtitle?: string
  danger?:  boolean
}) {
  const colours = useColours()
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize:      '11px',
        fontWeight:    fontWeight.medium,
        color:         danger ? colours.danger : colours.textMuted,
        fontFamily:    fonts.sans,
        letterSpacing: '0.10em',
        textTransform: 'uppercase' as const,
        marginBottom:  subtitle ? '3px' : '0',
      }}>
        {children}
      </div>
      {subtitle && (
        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.sans,
          lineHeight: 1.4,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

/** Success / saved banner. */
function SavedBanner({ msg }: { msg?: string }) {
  const colours = useColours()
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
      padding:      '10px 14px',
      background:   colours.incomeLight,
      border:       `1px solid ${colours.income}33`,
      borderRadius: radius.md,
      fontSize:     fontSize.sm,
      color:        colours.income,
      fontFamily:   fonts.sans,
      fontWeight:   fontWeight.medium,
      marginBottom: '14px',
    }}>
      ✓ {msg ?? 'Changes saved successfully'}
    </div>
  )
}

/** Confirm modal — same logic as desktop, works well as a full-screen-inset on mobile. */
function ConfirmModal({ title, children, onConfirm, onCancel, confirmLabel = 'Continue', danger = false }: {
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
      WebkitBackdropFilter: 'blur(4px)',
      display:        'flex',
      alignItems:     'flex-end',
      zIndex:         310,
      padding:        '0',
    }}>
      <div style={{
        width:         '100%',
        background:    colours.panelBgSolid,
        border:        `1px solid ${colours.borderHairline}`,
        borderRadius:  `${radius.lg} ${radius.lg} 0 0`,
        padding:       '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
        maxHeight:     '85dvh',
        overflowY:     'auto',
      }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: colours.borderMedium, margin: '0 auto 20px' }} />
        <div style={{ fontSize: '16px', fontWeight: fontWeight.semibold, color: colours.textPrimary, fontFamily: fonts.sans, marginBottom: '14px' }}>
          {title}
        </div>
        <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, fontFamily: fonts.sans, lineHeight: 1.6, marginBottom: '24px' }}>
          {children}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ─── DeleteFlow ───────────────────────────────────────────────────────────────

function DeleteFlow({ client, onClose }: { client: Client; onClose: () => void }) {
  const colours = useColours()
  const [step, setStep] = useState<'legal' | 'verify' | 'confirm'>('legal')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifySent, setVerifySent] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const expectedText  = client.full_name?.trim() || 'DELETE MY ACCOUNT'
  const confirmMatch  = confirmText.trim().toLowerCase() === expectedText.toLowerCase()

  async function sendVerification() {
    setVerifyLoading(true)
    const supabase = createBrowserClient()
    await supabase.auth.signInWithOtp({ email: client.email, options: { shouldCreateUser: false } })
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
            Your tax data will be archived and cannot be erased within this period.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Your data rights.</strong> You have the right to request a copy of all data we hold under the UK GDPR.
            Email <strong>dpo@taxfoundry.co.uk</strong> to submit a subject access request.
          </p>
          <p style={{ margin: 0 }}>
            <strong>What happens immediately.</strong> Your portal access will be revoked. Any in-progress services will be halted.
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
        confirmLabel={verifySent ? "I've confirmed — continue" : 'Send verification email'}
        danger
      >
        {!verifySent ? (
          <>
            <p style={{ margin: '0 0 12px' }}>
              We'll send a one-time magic link to:
            </p>
            <div style={{
              padding:      '10px 14px',
              background:   colours.hoverBg,
              border:       `1px solid ${colours.borderMedium}`,
              borderRadius: radius.md,
              fontFamily:   fonts.sans,
              fontSize:     fontSize.sm,
              color:        colours.textPrimary,
              marginBottom: '12px',
              wordBreak:    'break-all' as const,
            }}>
              {client.email}
            </div>
            <Button variant="secondary" onClick={sendVerification} disabled={verifyLoading}>
              {verifyLoading ? 'Sending…' : 'Send verification email now'}
            </Button>
          </>
        ) : (
          <p style={{ margin: 0 }}>
            Email sent to <strong>{client.email}</strong>. Open the link, then tap "I've confirmed" below.
          </p>
        )}
      </ConfirmModal>
    )
  }

  // confirm step
  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display:        'flex',
      alignItems:     'flex-end',
      zIndex:         310,
    }}>
      <div style={{
        width:         '100%',
        background:    colours.panelBgSolid,
        border:        `1px solid ${colours.danger}44`,
        borderRadius:  `${radius.lg} ${radius.lg} 0 0`,
        padding:       '24px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
        maxHeight:     '85dvh',
        overflowY:     'auto',
      }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: colours.borderMedium, margin: '0 auto 20px' }} />
        <div style={{ fontSize: '16px', fontWeight: fontWeight.semibold, color: colours.danger, fontFamily: fonts.sans, marginBottom: '12px' }}>
          Final confirmation
        </div>
        <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, fontFamily: fonts.sans, lineHeight: 1.6, marginBottom: '16px' }}>
          This action cannot be undone. Type your full name to confirm:
          <div style={{
            marginTop:    '8px',
            fontFamily:   fonts.sans,
            fontSize:     fontSize.sm,
            color:        colours.textPrimary,
            background:   colours.hoverBg,
            border:       `1px solid ${colours.borderMedium}`,
            borderRadius: radius.md,
            padding:      '8px 12px',
            display:      'inline-block',
            wordBreak:    'break-all' as const,
          }}>
            {expectedText}
          </div>
        </div>
        <input
          type="text"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={`Type "${expectedText}"`}
          style={{
            width:        '100%',
            height:       '44px',
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
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          <Button variant="danger" disabled={!confirmMatch} onClick={() => {
            alert('Your deletion request has been received. Our team will process it within 48 hours and send confirmation to ' + client.email + '.')
            onClose()
          }}>
            Permanently delete my account
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface Props {
  client:  Client
  onClose: () => void
}

export default function MobileSettingsScreen({ client, onClose }: Props) {
  const colours           = useColours()
  const mode              = useThemeMode()
  const { mode: prefMode, setMode } = useThemePreference()
  const { saving, error, success, update, clearError } = useClientProfile(client.id)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const initial   = (client.full_name ?? 'U').charAt(0).toUpperCase()
  const planLabel   = PLAN_LABELS[client.plan]          ?? client.plan
  const statusLabel = STATUS_LABELS[client.plan_status] ?? client.plan_status

  // ── Section edit state ─────────────────────────────────────────────────────
  const [activeSection,  setActiveSection]  = useState<'personal' | 'tax' | null>(null)
  const [showTaxWarning, setShowTaxWarning] = useState(false)
  const [showDelete,     setShowDelete]     = useState(false)

  // ── Personal ───────────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    full_name:     client.full_name     ?? '',
    phone:         client.phone         ?? '',
    date_of_birth: client.date_of_birth ?? '',
  })
  const [personalDraft,   setPersonalDraft]   = useState(personal)
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

  // ── Tax ────────────────────────────────────────────────────────────────────
  const [tax, setTax] = useState({
    utr:         client.utr         ?? '',
    ni_number:   client.ni_number   ?? '',
    vat_number:  client.vat_number  ?? '',
    client_type: client.client_type,
    tax_year:    client.tax_year,
  })
  const [taxDraft,   setTaxDraft]   = useState(tax)
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
      logTaxChange(client.id, before, after).catch(e => console.error('AUDIT_TAX_001', e))
      setTax(taxDraft)
      setActiveSection(null)
      setTaxSuccess(true)
      setTimeout(() => setTaxSuccess(false), 4000)
    }
  }

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase')
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light',  label: 'Light',  icon: '☀' },
    { mode: 'dark',   label: 'Dark',   icon: '◑' },
    { mode: 'system', label: 'System', icon: '⊙' },
  ]

  if (!mounted) return null

  const screen = (
    <div style={{
      position:      'fixed',
      inset:         0,
      zIndex:        220,
      background:    colours.pageBg,
      display:       'flex',
      flexDirection: 'column',
      overflowY:     'hidden',
    }}>

      {/* ── Sticky header ── */}
      <div style={{
        position:       'sticky',
        top:            0,
        zIndex:         10,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        `calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px`,
        background:     colours.panelBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:   `1px solid ${colours.borderHairline}`,
        flexShrink:     0,
      }}>
        <button
          onClick={onClose}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            background: 'transparent',
            border:     'none',
            cursor:     'pointer',
            color:      colours.accent,
            fontFamily: fonts.sans,
            fontSize:   '15px',
            fontWeight: fontWeight.medium,
            padding:    '4px 0',
          }}
        >
          ← Back
        </button>
        <span style={{
          fontFamily:  fonts.sans,
          fontSize:    '16px',
          fontWeight:  fontWeight.semibold,
          color:       colours.textPrimary,
          letterSpacing: '-0.01em',
        }}>
          Settings
        </span>
        <div style={{ width: '60px' }} /> {/* balance */}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex:        1,
        overflowY:   'auto',
        padding:     `20px 16px calc(env(safe-area-inset-bottom, 0px) + 32px)`,
        display:     'flex',
        flexDirection:'column',
        gap:         '16px',
      }}>

        {/* Profile card */}
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width:          '52px',
              height:         '52px',
              borderRadius:   radius.circle,
              background:     colours.accentSoft,
              border:         `1px solid ${colours.accentBorder}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '22px',
              fontWeight:     fontWeight.semibold,
              color:          colours.accent,
              fontFamily:     fonts.sans,
              flexShrink:     0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fonts.sans, fontSize: '16px', fontWeight: fontWeight.semibold, color: colours.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {client.full_name ?? '—'}
              </div>
              <div style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {client.email}
              </div>
              <div style={{
                display:      'inline-block',
                marginTop:    '6px',
                padding:      '2px 8px',
                background:   colours.accentLight,
                borderRadius: radius.sm,
                fontSize:     '11px',
                fontWeight:   fontWeight.medium,
                color:        colours.accent,
                fontFamily:   fonts.sans,
                letterSpacing:'0.04em',
                textTransform:'uppercase' as const,
              }}>
                {planLabel}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard>
          <SectionLabel subtitle="Choose how Foundry looks on this device.">Appearance</SectionLabel>
          <div style={{ display: 'flex', gap: '8px' }}>
            {THEME_OPTIONS.map(opt => {
              const active = prefMode === opt.mode
              return (
                <button
                  key={opt.mode}
                  onClick={() => setMode(opt.mode)}
                  style={{
                    flex:         1,
                    height:       '44px',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent:'center',
                    gap:          '6px',
                    borderRadius: radius.md,
                    border:       `1px solid ${active ? colours.accentBorder : colours.borderMedium}`,
                    background:   active ? colours.accentLight : colours.hoverBg,
                    color:        active ? colours.accent : colours.textSecondary,
                    fontFamily:   fonts.sans,
                    fontSize:     '13px',
                    fontWeight:   active ? fontWeight.medium : fontWeight.regular,
                    cursor:       'pointer',
                    transition:   'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{opt.icon}</span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* Personal information */}
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <SectionLabel subtitle="Name, contact details, date of birth">Personal information</SectionLabel>
            {activeSection !== 'personal' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (activeSection === 'tax') return
                  setPersonalDraft(personal)
                  setActiveSection('personal')
                  clearError()
                }}
              >
                Edit
              </Button>
            )}
          </div>

          {error && activeSection === 'personal' && (
            <div style={{ marginBottom: '14px' }}><ErrorBanner error={error} /></div>
          )}
          {personalSuccess && activeSection !== 'personal' && <SavedBanner />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
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
                {/* Save / cancel */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <Button variant="ghost" onClick={() => setActiveSection(null)} disabled={saving}>Cancel</Button>
                  </div>
                  <div style={{ flex: 2 }}>
                    <Button variant="primary" onClick={savePersonal} disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </div>
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
        </SectionCard>

        {/* Tax warning modal */}
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
                Your tax information is used to calculate your liability and file your Self Assessment return. Please be aware:
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Changes take effect on your <strong>next</strong> tax calculation — past returns are not affected.</li>
                <li>Changing your tax year or client type mid-period can cause your return to be filed on the wrong basis.</li>
                <li>All changes are <strong>permanently logged</strong> and visible to your accountant.</li>
                <li>If you're unsure, message your accountant first.</li>
              </ul>
            </div>
          </ConfirmModal>
        )}

        {/* Tax information */}
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <SectionLabel subtitle="HMRC reference numbers and filing configuration">Tax information</SectionLabel>
            {activeSection !== 'tax' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (activeSection === 'personal') return
                  setShowTaxWarning(true)
                }}
              >
                Edit
              </Button>
            )}
          </div>

          {error && activeSection === 'tax' && (
            <div style={{ marginBottom: '14px' }}><ErrorBanner error={error} /></div>
          )}
          {taxSuccess && activeSection !== 'tax' && (
            <SavedBanner msg="Changes saved — your accountant has been notified" />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            {activeSection === 'tax' ? (
              <>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, fontFamily: fonts.sans }}>
                    UTR number <InfoTip id="utr" />
                  </div>
                  <Input
                    value={taxDraft.utr}
                    onChange={v => setTaxDraft(d => ({ ...d, utr: v }))}
                    placeholder="10-digit Unique Taxpayer Reference"
                    autoFocus
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, fontFamily: fonts.sans }}>
                    National Insurance no. <InfoTip id="ni" />
                  </div>
                  <Input
                    value={taxDraft.ni_number}
                    onChange={v => setTaxDraft(d => ({ ...d, ni_number: v }))}
                    placeholder="e.g. AB 12 34 56 C"
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, fontFamily: fonts.sans }}>
                    Client type <InfoTip id="client_type" />
                  </div>
                  <Select
                    value={taxDraft.client_type}
                    onChange={v => setTaxDraft(d => ({ ...d, client_type: v as ClientType }))}
                    options={CLIENT_TYPE_OPTIONS}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, fontFamily: fonts.sans }}>
                    Tax year <InfoTip id="tax_year" />
                  </div>
                  <Select
                    value={taxDraft.tax_year}
                    onChange={v => setTaxDraft(d => ({ ...d, tax_year: v }))}
                    options={TAX_YEAR_OPTIONS}
                  />
                </div>
                <LockedField label="Accounting year end" value={client.accounting_period_label} lockId="accounting_year_end" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, fontFamily: fonts.sans }}>
                    VAT number (optional) <InfoTip id="vat" />
                  </div>
                  <Input
                    value={taxDraft.vat_number}
                    onChange={v => setTaxDraft(d => ({ ...d, vat_number: v }))}
                    placeholder="e.g. GB 123 4567 89"
                  />
                </div>
                {/* Save / cancel */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <div style={{ flex: 1 }}>
                    <Button variant="ghost" onClick={() => setActiveSection(null)} disabled={saving}>Cancel</Button>
                  </div>
                  <div style={{ flex: 2 }}>
                    <Button variant="primary" onClick={saveTax} disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <ReadField
                  label="UTR number"
                  value={tax.utr}
                  tip="utr"
                  badge={!tax.utr ? 'Required for filing' : undefined}
                />
                <ReadField
                  label="National Insurance no."
                  value={tax.ni_number}
                  tip="ni"
                  badge={!tax.ni_number ? 'Required' : undefined}
                />
                <ReadField
                  label="Client type"
                  value={CLIENT_TYPE_OPTIONS.find(o => o.value === tax.client_type)?.label ?? tax.client_type}
                  tip="client_type"
                />
                <ReadField label="Tax year"            value={tax.tax_year}    tip="tax_year" />
                <LockedField label="Accounting year end" value={client.accounting_period_label} lockId="accounting_year_end" />
                <ReadField label="VAT number"          value={tax.vat_number}  tip="vat" />
              </>
            )}
          </div>
        </SectionCard>

        {/* Subscription */}
        <SectionCard>
          <SectionLabel>Subscription</SectionLabel>
          <div style={{
            border:         `1px solid ${colours.borderMedium}`,
            borderRadius:   radius.lg,
            padding:        '16px',
            display:        'flex',
            alignItems:     'flex-start',
            justifyContent: 'space-between',
            gap:            '12px',
            marginBottom:   '14px',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fonts.sans, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colours.textPrimary, marginBottom: '4px' }}>
                {planLabel}
              </div>
              <div style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted }}>
                SA filing support · Secure messages · Document vault
              </div>
            </div>
            <span style={{
              fontSize:     fontSize.xs,
              padding:      '4px 10px',
              borderRadius: radius.md,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button shimmer onClick={() => alert('Upgrade — message us in the app.')}>
              Upgrade to Core — £39/mo
            </Button>
            <Button variant="ghost" onClick={() => alert('Plan comparison — coming soon.')}>
              View all plans
            </Button>
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard>
          <SectionLabel>Account</SectionLabel>
          <button
            onClick={handleSignOut}
            style={{
              width:        '100%',
              height:       '48px',
              borderRadius: radius.md,
              border:       `1px solid ${colours.borderMedium}`,
              background:   colours.hoverBg,
              color:        colours.textSecondary,
              fontFamily:   fonts.sans,
              fontSize:     '14px',
              fontWeight:   fontWeight.medium,
              cursor:       'pointer',
              marginBottom: '10px',
              transition:   transition.snap,
            }}
          >
            Sign out
          </button>
        </SectionCard>

        {/* Danger zone */}
        <SectionCard>
          <SectionLabel danger>Danger zone</SectionLabel>
          <div style={{
            border:       `1px solid ${colours.danger}33`,
            borderRadius: radius.lg,
            padding:      '16px',
          }}>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '6px' }}>
              Delete account
            </div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted, lineHeight: 1.55, marginBottom: '14px' }}>
              We are legally required to retain financial records for 7 years.
              Deletion removes your portal access but data is archived per HMRC regulations.
            </div>
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              Delete account
            </Button>
          </div>
        </SectionCard>

      </div>

      {/* Delete flow */}
      {showDelete && <DeleteFlow client={client} onClose={() => setShowDelete(false)} />}
    </div>
  )

  return createPortal(screen, document.body)
}
