'use client'

/**
 * app/portal/components/tabs/SettingsTab.tsx
 *
 * Client profile settings — appearance, personal info, tax details,
 * subscription, and danger zone.
 *
 * Personal info and tax details are fully editable and write back to the
 * clients table via useClientProfile (anon client, RLS-gated to own row).
 */

import { useState } from 'react'
import type { Client, ClientType } from '@/types'
import { useColours } from '@/styles/ThemeContext'
import { useThemePreference } from '../PortalThemeProvider'
import type { ThemeMode } from '../PortalThemeProvider'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, spacing, transition } from '@/styles/tokens'
import { Panel, Input, Select, Button, ErrorBanner } from '../ui'
import { useClientProfile } from './useClientProfile'
import type { ProfileUpdate } from './useClientProfile'

// ─── Options ──────────────────────────────────────────────────────────────────

const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'sole_trader',      label: 'Sole Trader' },
  { value: 'landlord',         label: 'Landlord' },
  { value: 'content_creator',  label: 'Content Creator' },
  { value: 'cis_contractor',   label: 'CIS Contractor' },
  { value: 'tradesperson',     label: 'Tradesperson' },
  { value: 'hairdresser',      label: 'Hairdresser / Beauty' },
  { value: 'consultant',       label: 'Consultant' },
  { value: 'retailer',         label: 'Retailer' },
  { value: 'other',            label: 'Other' },
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

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title, subtitle, editing, saving,
  onEdit, onSave, onCancel,
}: {
  title:    string
  subtitle?: string
  editing:  boolean
  saving:   boolean
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
          <button
            onClick={onCancel}
            style={{
              padding:      '6px 14px',
              borderRadius: radius.md,
              border:       `1px solid ${colours.borderMedium}`,
              background:   'transparent',
              color:        colours.textSecondary,
              fontSize:     fontSize.sm,
              fontFamily:   fonts.sans,
              cursor:       'pointer',
              transition:   transition.snap,
            }}
          >
            Cancel
          </button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      ) : (
        <button
          onClick={onEdit}
          style={{
            padding:      '6px 14px',
            borderRadius: radius.md,
            border:       `1px solid ${colours.borderMedium}`,
            background:   'transparent',
            color:        colours.textSecondary,
            fontSize:     fontSize.sm,
            fontFamily:   fonts.sans,
            cursor:       'pointer',
            transition:   transition.snap,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = colours.accent
            e.currentTarget.style.color       = colours.accent
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = colours.borderMedium
            e.currentTarget.style.color       = colours.textSecondary
          }}
        >
          Edit
        </button>
      )}
    </div>
  )
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({ label, value, badge }: { label: string; value: string; badge?: string }) {
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
        gap:          '8px',
      }}>
        {label}
        {badge && (
          <span style={{
            fontSize:     '10px',
            padding:      '1px 6px',
            borderRadius: radius.xs,
            background:   colours.warningLight,
            color:        colours.warning,
            fontWeight:   fontWeight.medium,
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

// ─── Success toast ────────────────────────────────────────────────────────────

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
      <span style={{ fontSize: '12px' }}>✓</span>
      Changes saved
    </div>
  )
}

// ─── Theme pill ───────────────────────────────────────────────────────────────

function ThemePill({ label, icon, active, onClick }: {
  label:   string
  icon:    string
  active:  boolean
  onClick: () => void
}) {
  const colours  = useColours()
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        padding:    '10px 18px',
        borderRadius: radius.lg,
        border:     active
          ? `1.5px solid ${colours.accent}`
          : `1px solid ${colours.borderMedium}`,
        background: active
          ? colours.accentLight
          : hovered ? colours.hoverBg : 'transparent',
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

  // ── Personal info ──────────────────────────────────────────────────────────
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [personal, setPersonal] = useState({
    full_name:     client.full_name     ?? '',
    phone:         client.phone         ?? '',
    date_of_birth: client.date_of_birth ?? '',
  })
  const [personalDraft, setPersonalDraft] = useState(personal)

  async function savePersonal() {
    const ok = await update({
      full_name:     personalDraft.full_name.trim()     || null,
      phone:         personalDraft.phone.trim()         || null,
      date_of_birth: personalDraft.date_of_birth.trim() || null,
    } satisfies ProfileUpdate)
    if (ok) { setPersonal(personalDraft); setEditingPersonal(false) }
  }

  // ── Tax info ───────────────────────────────────────────────────────────────
  const [editingTax, setEditingTax] = useState(false)
  const [tax, setTax] = useState({
    utr:         client.utr         ?? '',
    ni_number:   client.ni_number   ?? '',
    vat_number:  client.vat_number  ?? '',
    client_type: client.client_type,
    tax_year:    client.tax_year,
  })
  const [taxDraft, setTaxDraft] = useState(tax)

  async function saveTax() {
    const ok = await update({
      utr:         taxDraft.utr.trim()        || null,
      ni_number:   taxDraft.ni_number.trim()  || null,
      vat_number:  taxDraft.vat_number.trim() || null,
      client_type: taxDraft.client_type,
      tax_year:    taxDraft.tax_year,
    } satisfies ProfileUpdate)
    if (ok) { setTax(taxDraft); setEditingTax(false) }
  }

  const planLabel   = PLAN_LABELS[client.plan]   ?? client.plan
  const statusLabel = STATUS_LABELS[client.plan_status] ?? client.plan_status

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
            <ThemePill
              key={opt.mode}
              label={opt.label}
              icon={opt.icon}
              active={mode === opt.mode}
              onClick={() => setMode(opt.mode)}
            />
          ))}
        </div>
      </Panel>

      {/* ── Personal information ── */}
      <Panel padding={spacing.panel.padding}>
        <SectionHeader
          title="Personal information"
          subtitle="Your name, contact details, and date of birth"
          editing={editingPersonal}
          saving={saving}
          onEdit={() => { setPersonalDraft(personal); setEditingPersonal(true); clearError() }}
          onSave={savePersonal}
          onCancel={() => setEditingPersonal(false)}
        />

        {error && editingPersonal && (
          <div style={{ marginBottom: '16px' }}>
            <ErrorBanner error={error} />
          </div>
        )}
        {success && !editingPersonal && <SavedBadge />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          {editingPersonal ? (
            <>
              <Input
                label="Full name"
                value={personalDraft.full_name}
                onChange={v => setPersonalDraft(d => ({ ...d, full_name: v }))}
                placeholder="e.g. Sarah Mitchell"
                autoFocus
              />
              <ReadField label="Email address" value={client.email} />
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
              <ReadField label="Full name"      value={personal.full_name} />
              <ReadField label="Email address"  value={client.email} />
              <ReadField label="Phone"          value={personal.phone} />
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

      {/* ── Tax information ── */}
      <Panel padding={spacing.panel.padding}>
        <SectionHeader
          title="Tax information"
          subtitle="Your HMRC reference numbers and filing configuration"
          editing={editingTax}
          saving={saving}
          onEdit={() => { setTaxDraft(tax); setEditingTax(true); clearError() }}
          onSave={saveTax}
          onCancel={() => setEditingTax(false)}
        />

        {error && editingTax && (
          <div style={{ marginBottom: '16px' }}>
            <ErrorBanner error={error} />
          </div>
        )}
        {success && !editingTax && <SavedBadge />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          {editingTax ? (
            <>
              <Input
                label="UTR number"
                value={taxDraft.utr}
                onChange={v => setTaxDraft(d => ({ ...d, utr: v }))}
                placeholder="10-digit Unique Taxpayer Reference"
                autoFocus
              />
              <Input
                label="National Insurance no."
                value={taxDraft.ni_number}
                onChange={v => setTaxDraft(d => ({ ...d, ni_number: v }))}
                placeholder="e.g. AB 12 34 56 C"
              />
              <Select
                label="Client type"
                value={taxDraft.client_type}
                onChange={v => setTaxDraft(d => ({ ...d, client_type: v as ClientType }))}
                options={CLIENT_TYPE_OPTIONS}
              />
              <Select
                label="Tax year"
                value={taxDraft.tax_year}
                onChange={v => setTaxDraft(d => ({ ...d, tax_year: v }))}
                options={TAX_YEAR_OPTIONS}
              />
              <ReadField
                label="Accounting year end"
                value={client.accounting_period_label}
              />
              <Input
                label="VAT number (optional)"
                value={taxDraft.vat_number}
                onChange={v => setTaxDraft(d => ({ ...d, vat_number: v }))}
                placeholder="e.g. GB 123 4567 89"
              />
            </>
          ) : (
            <>
              <ReadField
                label="UTR number"
                value={tax.utr}
                badge={!tax.utr ? 'Required for filing' : undefined}
              />
              <ReadField
                label="National Insurance no."
                value={tax.ni_number}
                badge={!tax.ni_number ? 'Required' : undefined}
              />
              <ReadField label="Client type"          value={CLIENT_TYPE_OPTIONS.find(o => o.value === tax.client_type)?.label ?? tax.client_type} />
              <ReadField label="Tax year"             value={tax.tax_year} />
              <ReadField label="Accounting year end"  value={client.accounting_period_label} />
              <ReadField label="VAT number"           value={tax.vat_number} />
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
          border:       `1px solid ${colours.borderMedium}`,
          borderRadius: radius.lg,
          padding:      '18px 20px',
          display:      'flex',
          alignItems:   'flex-start',
          justifyContent: 'space-between',
          gap:          '16px',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{
              fontSize:   fontSize.base,
              fontWeight: fontWeight.semibold,
              color:      colours.textPrimary,
              fontFamily: fonts.sans,
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
            onClick={() => alert('Upgrade — coming soon. Contact support@taxfoundry.co.uk.')}
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
          color:         colours.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: letterSpacing.wide,
          fontFamily:    fonts.mono,
          marginBottom:  '16px',
        }}>
          Danger zone
        </div>
        <div style={{
          fontSize:     fontSize.sm,
          color:        colours.textMuted,
          marginBottom: '16px',
          fontFamily:   fonts.sans,
        }}>
          Deleting your account is permanent and cannot be undone.
        </div>
        <button
          onClick={() => alert('Account deletion — contact support@taxfoundry.co.uk.')}
          style={{
            padding:      '9px 20px',
            borderRadius: radius.pill,
            border:       `1px solid ${colours.danger}`,
            background:   'transparent',
            color:        colours.danger,
            fontSize:     fontSize.sm,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            cursor:       'pointer',
          }}
        >
          Delete account
        </button>
      </Panel>

    </div>
  )
}
