'use client'

/**
 * app/accountant/components/panels/OverviewPanel.tsx
 *
 * Right panel — Overview tab.
 * Shows client health at a glance: SA deadline, missing items, and
 * private working notes (never visible to the client).
 */

import { useAccountantNotes } from '../../hooks/useAccountantNotes'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glass }              from '@/styles/tokens/effects'
import { radius, transition } from '@/styles/tokens'
import { spacing }            from '@/styles/tokens/spacing'
import type { Client, SplitPanelInitialData } from '@/types'

interface Props {
  client:       Client
  accountantId: string | null
  initialData:  SplitPanelInitialData
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colours = useColours()
  return (
    <div style={{
      fontSize:      fontSize.label,
      fontFamily:    fonts.mono,
      letterSpacing: letterSpacing.wide,
      color:         colours.textMuted,
      textTransform: 'uppercase' as const,
      marginBottom:  '10px',
      paddingBottom: '6px',
      borderBottom:  `1px solid ${colours.borderHairline}`,
    }}>
      {title}
    </div>
  )
}

// ─── Checklist item ───────────────────────────────────────────────────────────

function CheckItem({
  done,
  label,
  count,
}: {
  done:   boolean
  label:  string
  count?: number
}) {
  const colours = useColours()
  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '8px',
      padding:    '5px 0',
      fontSize:   fontSize.sm,
      color:      done ? colours.textMuted : colours.textPrimary,
      opacity:    done ? 0.6 : 1,
    }}>
      <span style={{
        fontSize:  '12px',
        color:     done ? colours.income : colours.warning,
        flexShrink: 0,
      }}>
        {done ? '✓' : '○'}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize:      fontSize.label,
          fontFamily:    fonts.mono,
          color:         colours.warning,
          background:    colours.warningLight,
          padding:       '1px 6px',
          borderRadius:  radius.xs,
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function OverviewPanel({ client, accountantId, initialData }: Props) {
  const colours = useColours()
  const mode = useThemeMode()
  const {
    body,
    setBody,
    saving,
    saved,
    error: noteError,
    saveNote,
  } = useAccountantNotes(client.id, accountantId)

  const {
    saDaysRemaining,
    pendingReviewCount,
    unreviewedDocCount,
    unreadMessages,
  } = initialData

  const saColour = saDaysRemaining === null
    ? colours.textMuted
    : saDaysRemaining <= 14
      ? colours.danger
      : saDaysRemaining <= 30
        ? colours.warningDark
        : colours.income

  return (
    <div style={{ padding: spacing.panel.padding, display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── SA Deadline ── */}
      <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
        <SectionHeader title="SA Deadline" />
        {saDaysRemaining === null ? (
          <div style={{ fontSize: fontSize.sm, color: colours.textMuted }}>No upcoming deadline found.</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontFamily: fonts.sans,
              fontSize:   '28px',
              fontWeight: fontWeight.medium,
              color:      saColour,
            }}>
              {saDaysRemaining}
            </span>
            <span style={{ fontSize: fontSize.sm, color: colours.textMuted }}>days remaining</span>
          </div>
        )}
      </div>

      {/* ── Missing items checklist ── */}
      <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
        <SectionHeader title="Checklist" />
        <CheckItem
          done={unreadMessages === 0}
          label="No unread client messages"
          count={unreadMessages > 0 ? unreadMessages : undefined}
        />
        <CheckItem
          done={pendingReviewCount === 0}
          label="All expenses reviewed"
          count={pendingReviewCount > 0 ? pendingReviewCount : undefined}
        />
        <CheckItem
          done={unreviewedDocCount === 0}
          label="All documents reviewed"
          count={unreviewedDocCount > 0 ? unreviewedDocCount : undefined}
        />
        <CheckItem
          done={!!client.utr}
          label="UTR on file"
        />
        <CheckItem
          done={!!client.ni_number}
          label="NI number on file"
        />
      </div>

      {/* ── Working notes ── */}
      <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
        <SectionHeader title="Working notes" />
        <div style={{
          fontSize:     fontSize.xs,
          color:        colours.textMuted,
          marginBottom: '10px',
          lineHeight:   1.5,
        }}>
          Private notes — never visible to {client.full_name?.split(' ')[0] ?? 'the client'}.
        </div>

        {noteError && (
          <div style={{
            fontSize:     fontSize.xs,
            color:        colours.danger,
            background:   colours.dangerLight,
            borderRadius: radius.sm,
            padding:      '6px 10px',
            marginBottom: '8px',
          }}>
            {noteError.code} — {noteError.message}
          </div>
        )}

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={6}
          placeholder="Add working notes about this client…"
          style={{
            width:        '100%',
            padding:      '10px 12px',
            border:       `1px solid ${colours.borderMedium}`,
            borderRadius: radius.md,
            fontSize:     fontSize.sm,
            color:        colours.textPrimary,
            fontFamily:   fonts.sans,
            background:   colours.inputBg,
            resize:       'vertical' as const,
            outline:      'none',
            lineHeight:   1.6,
            transition:   transition.snap,
            boxSizing:    'border-box' as const,
          }}
          onFocus={e  => { e.target.style.borderColor = colours.accent }}
          onBlur={e   => { e.target.style.borderColor = colours.borderMedium }}
        />

        <button
          onClick={saveNote}
          disabled={saving}
          style={{
            marginTop:    '8px',
            padding:      '8px 16px',
            background:   saved ? colours.income : colours.accent,
            color:        colours.textInverse,
            border:       'none',
            borderRadius: radius.pill,
            fontSize:     fontSize.sm,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            cursor:       saving ? 'not-allowed' : 'pointer',
            opacity:      saving ? 0.6 : 1,
            transition:   transition.snap,
          }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
        </button>
      </div>

    </div>
  )
}
