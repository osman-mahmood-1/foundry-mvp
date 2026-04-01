'use client'

/**
 * app/accountant/components/panels/DocumentsPanel.tsx
 *
 * Right panel — Documents tab.
 * Shows document review status and allows marking documents as reviewed.
 *
 * "Mark as reviewed" uses a server action (markDocumentReviewed) because
 * the documents table does not yet have accountant-write RLS.
 * The server action verifies assignment before updating.
 */

import { useState }             from 'react'
import { markDocumentReviewed } from '../../actions'
import { light as colours }     from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glassStatic }          from '@/styles/tokens/effects'
import { radius, transition }   from '@/styles/tokens'
import { spacing }              from '@/styles/tokens/spacing'
import type { Client, Document as FoundryDocument, SplitPanelInitialData } from '@/types'

interface Props {
  client:      Client
  initialData: SplitPanelInitialData
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SectionHeader({ title }: { title: string }) {
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

// ─── Document row with mark-reviewed ─────────────────────────────────────────

function DocumentReviewRow({
  doc,
  clientId,
  onReviewed,
}: {
  doc:        FoundryDocument
  clientId:   string
  onReviewed: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const ext = doc.original_filename.split('.').pop()?.toUpperCase() ?? 'FILE'

  async function handleMarkReviewed() {
    setLoading(true)
    setError(null)
    const result = await markDocumentReviewed(doc.id, clientId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onReviewed(doc.id)
    }
  }

  return (
    <div style={{
      padding:      '10px 0',
      borderBottom: `1px solid ${colours.borderHairline}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* File type badge */}
        <div style={{
          padding:      '3px 6px',
          background:   colours.borderLight,
          borderRadius: radius.xs,
          fontSize:     '9px',
          fontFamily:   fonts.mono,
          color:        colours.textMuted,
          letterSpacing: '0.04em',
          flexShrink:   0,
          marginTop:    '2px',
        }}>
          {ext}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:     fontSize.sm,
            fontWeight:   fontWeight.medium,
            color:        colours.textPrimary,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap' as const,
            marginBottom: '2px',
          }}>
            {doc.original_filename}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted, display: 'flex', gap: '8px' }}>
            <span style={{ fontFamily: fonts.mono }}>{formatBytes(doc.size_bytes)}</span>
            <span>{doc.category.replace(/_/g, ' ')}</span>
          </div>
          {error && (
            <div style={{ fontSize: fontSize.xs, color: colours.danger, marginTop: '4px' }}>{error}</div>
          )}
        </div>

        {/* Action */}
        {doc.reviewed ? (
          <span style={{ fontSize: fontSize.xs, color: colours.income, flexShrink: 0, fontFamily: fonts.mono }}>
            ✓ Reviewed
          </span>
        ) : (
          <button
            onClick={handleMarkReviewed}
            disabled={loading}
            style={{
              padding:      '4px 10px',
              background:   'transparent',
              border:       `1px solid ${colours.borderMedium}`,
              borderRadius: radius.xs,
              fontSize:     fontSize.xs,
              fontFamily:   fonts.sans,
              color:        colours.textSecondary,
              cursor:       loading ? 'not-allowed' : 'pointer',
              flexShrink:   0,
              transition:   transition.snap,
              opacity:      loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colours.accent; e.currentTarget.style.color = colours.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colours.borderMedium; e.currentTarget.style.color = colours.textSecondary }}
          >
            {loading ? '…' : 'Mark reviewed'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function DocumentsPanel({ client, initialData }: Props) {
  const [documents, setDocuments] = useState<FoundryDocument[]>(initialData.documents)

  const reviewed   = documents.filter(d => d.reviewed)
  const unreviewed = documents.filter(d => !d.reviewed)

  function handleReviewed(id: string) {
    setDocuments(prev => prev.map(d =>
      d.id === id ? { ...d, reviewed: true } : d
    ))
  }

  return (
    <div style={{ padding: spacing.panel.padding, display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Status summary ── */}
      <div style={{ ...glassStatic.panel, padding: spacing.panel.paddingTight }}>
        <SectionHeader title="Status" />
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <div style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.medium, color: colours.income }}>
              {reviewed.length}
            </div>
            <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>Reviewed</div>
          </div>
          <div>
            <div style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.medium, color: '#F59E0B' }}>
              {unreviewed.length}
            </div>
            <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>Pending</div>
          </div>
        </div>
      </div>

      {/* ── Unreviewed documents ── */}
      {unreviewed.length > 0 && (
        <div style={{ ...glassStatic.panel, padding: spacing.panel.paddingTight }}>
          <SectionHeader title={`To review (${unreviewed.length})`} />
          {unreviewed.map(doc => (
            <DocumentReviewRow
              key={doc.id}
              doc={doc}
              clientId={client.id}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      )}

      {/* ── Reviewed documents ── */}
      {reviewed.length > 0 && (
        <div style={{ ...glassStatic.panel, padding: spacing.panel.paddingTight }}>
          <SectionHeader title={`Reviewed (${reviewed.length})`} />
          {reviewed.map(doc => (
            <DocumentReviewRow
              key={doc.id}
              doc={doc}
              clientId={client.id}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <div style={{ ...glassStatic.panel, padding: spacing.panel.padding, textAlign: 'center', color: colours.textMuted, fontSize: fontSize.sm }}>
          No documents uploaded yet.
        </div>
      )}

    </div>
  )
}
