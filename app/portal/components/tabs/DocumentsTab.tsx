'use client'

/**
 * app/portal/components/tabs/DocumentsTab.tsx
 *
 * Documents tab — upload and view documents for the current tax year.
 * Month-grouped display with progressive loading.
 *
 * Upload flow:
 *   User selects file → selects category → clicks Upload
 *   → useDocuments.uploadDocument() → Supabase Storage → metadata row
 *   → list refreshes
 *
 * Mobile note: input with accept and capture attributes enables
 * direct camera capture on iOS/Android at zero additional cost.
 */

import { useRef, useState } from 'react'
import type { Client, DocumentCategory, Document as FoundryDocument } from '@/types'
import { useDocuments } from './useDocuments'
import {
  Panel, Label, EmptyState, Spinner,
  Badge, Button, Select, ErrorBanner, formatBytes, formatDate,
} from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

// ─── Document category options ────────────────────────────────────────────────

const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'bank_statement',          label: 'Bank statement' },
  { value: 'mortgage_statement',      label: 'Mortgage statement' },
  { value: 'tenancy_agreement',       label: 'Tenancy agreement' },
  { value: 'insurance',               label: 'Insurance certificate' },
  { value: 'invoice',                 label: 'Invoice' },
  { value: 'receipt',                 label: 'Receipt' },
  { value: 'p60',                     label: 'P60' },
  { value: 'p45',                     label: 'P45' },
  { value: 'sa302',                   label: 'SA302 tax calculation' },
  { value: 'letting_agent_statement', label: 'Letting agent statement' },
  { value: 'cis_statement',           label: 'CIS statement' },
  { value: 'contracts',               label: 'Contract' },
  { value: 'other',                   label: 'Other document' },
]

// ─── File type config ─────────────────────────────────────────────────────────

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.heic'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

// ─── Month helper ─────────────────────────────────────────────────────────────

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client:    Client
  readOnly?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentsTab({ client, readOnly = false }: Props) {
  const fileInputRef                            = useRef<HTMLInputElement>(null)
  const [selectedFile,     setSelectedFile]     = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('other')
  const [fileError,        setFileError]        = useState<string | null>(null)

  const {
    documents,
    totalCount,
    availableMonths,
    loadedMonths,
    hasMore,
    loadingMore,
    loadMonth,
    loading,
    uploading,
    error,
    uploadDocument,
    deleteDocument,
  } = useDocuments(client.id, client.tax_year, client.user_id)

  // ── File selection ──────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    if (!file) return
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('File is too large. Maximum size is 10MB.')
      return
    }
    setSelectedFile(file)
  }

  // ── Upload ──────────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return
    await uploadDocument(selectedFile, selectedCategory)
    setSelectedFile(null)
    setSelectedCategory('other')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Month grouping ──────────────────────────────────────────────
  const groups: Record<string, FoundryDocument[]> = {}
  for (const doc of documents) {
    const m = doc.created_at.slice(0, 7)
    if (!groups[m]) groups[m] = []
    groups[m].push(doc)
  }
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  const nextMonth = availableMonths.find(m => !loadedMonths.includes(m))

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Upload panel — hidden in read-only mode ── */}
      {!readOnly && <Panel>
        <Label>Upload document · {client.tax_year}</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border:       `2px dashed ${selectedFile ? colours.accent : colours.borderMedium}`,
              borderRadius: radius.md,
              padding:      '24px',
              textAlign:    'center',
              cursor:       'pointer',
              background:   selectedFile ? colours.accentSoft : colours.hoverBg,
              transition:   transition.snap,
            }}
          >
            {selectedFile ? (
              <div>
                <div style={{
                  fontSize:     fontSize.base,
                  fontWeight:   fontWeight.medium,
                  color:        colours.textPrimary,
                  marginBottom: '4px',
                }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
                  {formatBytes(selectedFile.size)} · Click to change
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>◈</div>
                <div style={{
                  fontSize:     fontSize.base,
                  color:        colours.textSecondary,
                  marginBottom: '4px',
                }}>
                  Click to select a file
                </div>
                <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
                  PDF, JPG, PNG or HEIC · Max 10MB
                </div>
              </div>
            )}
          </div>

          {fileError && (
            <div style={{
              fontSize:     fontSize.xs,
              color:        colours.danger,
              padding:      '8px 12px',
              background:   colours.dangerLight,
              borderRadius: radius.sm,
            }}>
              {fileError}
            </div>
          )}

          {error && <ErrorBanner error={error} />}

          <Select
            label="Document type"
            value={selectedCategory}
            onChange={v => setSelectedCategory(v as DocumentCategory)}
            options={DOCUMENT_CATEGORIES}
          />

          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading…' : 'Upload document'}
          </Button>
        </div>
      </Panel>}

      {/* ── Document list ── */}
      <Panel padding="0">
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          borderBottom:   documents.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
        }}>
          <Label>Documents · {client.tax_year}</Label>
          {totalCount > 0 && (
            <span style={{
              fontSize:  fontSize.xs,
              color:     colours.textMuted,
              fontFamily: fonts.mono,
            }}>
              {totalCount} total
            </span>
          )}
        </div>

        {documents.length === 0 && totalCount === 0 && (
          <EmptyState
            icon="◈"
            headline="No documents uploaded yet."
            sub="Upload your bank statements, receipts, and supporting documents here. Your accountant will review each one."
          />
        )}

        {/* Month groups */}
        {sortedGroupKeys.map(month => {
          const rows = groups[month]
          return (
            <div key={month}>
              <div style={{
                display:      'flex',
                alignItems:   'center',
                padding:      `8px ${spacing.panel.padding}`,
                background:   colours.hoverBg,
                borderBottom: `1px solid ${colours.borderHairline}`,
              }}>
                <span style={{
                  fontSize:      fontSize.xs,
                  fontWeight:    fontWeight.medium,
                  color:         colours.textSecondary,
                  letterSpacing: '0.04em',
                }}>
                  {formatMonthLabel(month)}
                  <span style={{ opacity: 0.5, margin: '0 6px' }}>·</span>
                  {rows.length} document{rows.length === 1 ? '' : 's'}
                </span>
              </div>
              {rows.map((doc, idx) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isLast={idx === rows.length - 1}
                  onDelete={readOnly ? undefined : () => deleteDocument(doc.id, doc.storage_path)}
                />
              ))}
            </div>
          )
        })}

        {/* Load more month */}
        {hasMore && nextMonth && (
          <div style={{
            borderTop:      `1px solid ${colours.borderHairline}`,
            padding:        '14px',
            display:        'flex',
            justifyContent: 'center',
          }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMonth}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : `Load ${formatMonthLabel(nextMonth)}`}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}

// ─── Document row ─────────────────────────────────────────────────────────────

interface DocumentRowProps {
  doc:       FoundryDocument
  isLast:    boolean
  onDelete?: () => void
}

function DocumentRow({ doc, isLast, onDelete }: DocumentRowProps) {
  const [hovered, setHovered] = useState(false)

  const categoryLabel = DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label
    ?? doc.category

  const ext = doc.original_filename.split('.').pop()?.toUpperCase() ?? 'FILE'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        spacing.table.rowPadding,
        borderBottom:   isLast ? 'none' : `1px solid ${colours.borderHairline}`,
        background:     hovered ? colours.hoverBg : 'transparent',
        transition:     transition.snap,
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   radius.sm,
          background:     colours.accentSoft,
          border:         `1px solid ${colours.accentBorder}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '9px',
          fontFamily:     fonts.mono,
          color:          colours.accent,
          fontWeight:     fontWeight.semibold,
          flexShrink:     0,
        }}>
          {ext}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize:     fontSize.base,
            fontWeight:   fontWeight.medium,
            color:        colours.textPrimary,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap' as const,
          }}>
            {doc.original_filename}
          </div>
          <div style={{
            fontSize:   fontSize.xs,
            color:      colours.textMuted,
            marginTop:  '2px',
            display:    'flex',
            gap:        '8px',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: fonts.mono }}>{formatDate(doc.created_at)}</span>
            <Badge variant="info">{categoryLabel}</Badge>
            <Badge variant={doc.reviewed ? 'success' : 'warning'}>
              {doc.reviewed ? 'Reviewed' : 'Awaiting review'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.mono }}>
          {formatBytes(doc.size_bytes)}
        </div>
        {hovered && onDelete && (
          <button
            onClick={onDelete}
            title="Remove document"
            style={{
              width:          '24px',
              height:         '24px',
              borderRadius:   radius.circle,
              background:     colours.dangerLight,
              border:         'none',
              color:          colours.danger,
              fontSize:       '11px',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     transition.snap,
              flexShrink:     0,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
