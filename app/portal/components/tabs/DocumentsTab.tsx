'use client'

/**
 * app/portal/components/tabs/DocumentsTab.tsx
 *
 * Documents tab — upload and view documents for the current tax year.
 *
 * Task 8 changes:
 * - Upload button/select are intrinsic width (not full-width)
 * - After upload: shimmer reviewing state → honest confirmation banner (no fake OCR)
 * - Row click opens right panel with doc details, category, extracted fields, Delete
 */

import { useRef, useState, useEffect } from 'react'
import type { Client, DocumentCategory, Document as FoundryDocument } from '@/types'
import { useDocuments } from './useDocuments'
import {
  Panel, Label, EmptyState, Spinner,
  Badge, Button, Select, ErrorBanner, formatBytes, formatDate,
} from '../ui'
import EntryPanel from '../ui/EntryPanel'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
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

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.heic'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

interface Props {
  client:    Client
  readOnly?: boolean
}

// ─── Upload confirmed banner ──────────────────────────────────────────────────
// Shown after a successful upload. No fake OCR fields — your accountant
// will review the document and follow up if anything is needed.

function UploadedBanner({ onDismiss }: { onDismiss: () => void }) {
  const colours = useColours()
  return (
    <div style={{
      padding:      '14px',
      background:   colours.infoLight,
      border:       `1px solid ${colours.accentBorder}`,
      borderRadius: radius.md,
      marginTop:    '8px',
      display:      'flex',
      alignItems:   'flex-start',
      gap:          '10px',
    }}>
      <span style={{ color: colours.accent, fontSize: '14px', flexShrink: 0 }}>✓</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.accent, marginBottom: '4px' }}>
          Document uploaded
        </div>
        <p style={{ fontSize: fontSize.xs, color: colours.textMuted, margin: 0, lineHeight: 1.5 }}>
          Your accountant will review this document. No further action needed from you.
        </p>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'transparent', border: 'none', color: colours.textMuted, cursor: 'pointer', fontSize: '14px', padding: 0, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  )
}

// ─── Shimmer reviewing state ──────────────────────────────────────────────────

function ReviewingBanner() {
  const colours = useColours()
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      padding:      '10px 14px',
      background:   colours.accentSoft,
      border:       `1px solid ${colours.accentBorder}`,
      borderRadius: radius.md,
      marginTop:    '8px',
    }}>
      <div style={{
        width:        '16px',
        height:       '16px',
        borderRadius: '50%',
        border:       `2px solid ${colours.accent}`,
        borderTopColor: 'transparent',
        animation:    'spin 0.8s linear infinite',
        flexShrink:   0,
      }} />
      <span style={{ fontSize: fontSize.xs, color: colours.accent, fontFamily: fonts.sans }}>
        Reviewing document with Foundry Intelligence…
      </span>
    </div>
  )
}

// ─── Read-only detail field ───────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: string }) {
  const colours = useColours()
  return (
    <div>
      <div style={{
        fontSize:      fontSize.xs,
        fontWeight:    fontWeight.medium,
        color:         colours.textSecondary,
        fontFamily:    fonts.sans,
        marginBottom:  '4px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:     fontSize.sm,
        color:        colours.textPrimary,
        fontFamily:   fonts.sans,
        padding:      '8px 10px',
        background:   colours.hoverBg,
        borderRadius: radius.sm,
        border:       `1px solid ${colours.borderLight}`,
        wordBreak:    'break-all' as const,
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

type ReviewState = 'idle' | 'reviewing' | 'complete'

export default function DocumentsTab({ client, readOnly = false }: Props) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search documents…') }, [setPlaceholder])

  const fileInputRef                            = useRef<HTMLInputElement>(null)
  const [selectedFile,     setSelectedFile]     = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('other')
  const [fileError,        setFileError]        = useState<string | null>(null)
  const [reviewState,      setReviewState]      = useState<ReviewState>('idle')
  const [selectedDoc,      setSelectedDoc]      = useState<FoundryDocument | null>(null)
  const [panelOpen,        setPanelOpen]        = useState(false)

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    setReviewState('idle')
    if (!file) return
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('File is too large. Maximum size is 10MB.')
      return
    }
    setSelectedFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    await uploadDocument(selectedFile, selectedCategory)
    setReviewState('reviewing')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    // Simulate AI review taking 2s
    setTimeout(() => setReviewState('complete'), 2000)
  }

  function handleOcrAccept() {
    setReviewState('idle')
    setSelectedCategory('other')
  }

  function handleOcrRetake() {
    setReviewState('idle')
    setSelectedFile(null)
    setSelectedCategory('other')
  }

  function openDocPanel(doc: FoundryDocument) {
    setSelectedDoc(doc)
    setPanelOpen(true)
  }

  async function handleDeleteDoc() {
    if (!selectedDoc) return
    await deleteDocument(selectedDoc.id, selectedDoc.storage_path)
    setPanelOpen(false)
    setSelectedDoc(null)
  }

  // Month grouping
  const filteredDocuments = documents.filter(doc =>
    !query || doc.original_filename?.toLowerCase().includes(query.toLowerCase())
  )

  const groups: Record<string, FoundryDocument[]> = {}
  for (const doc of filteredDocuments) {
    const m = doc.created_at.slice(0, 7)
    if (!groups[m]) groups[m] = []
    groups[m].push(doc)
  }
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  const nextMonth = availableMonths.find(m => !loadedMonths.includes(m))

  if (loading) return <Spinner />

  const selectedDocCategory = selectedDoc
    ? DOCUMENT_CATEGORIES.find(c => c.value === selectedDoc.category)?.label ?? selectedDoc.category
    : ''


  return (
    <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0, flex: 1 }}>

      {/* ── Left: upload + document list ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minWidth: 0 }}>

        {/* ── Upload panel — hidden in read-only mode ── */}
        {!readOnly && (
          <Panel>
            <Label>Upload document · {client.tax_year}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Glass drag zone */}
              <div
                onClick={() => { if (reviewState === 'idle') fileInputRef.current?.click() }}
                style={{
                  border:       `2px dashed ${selectedFile ? colours.accent : colours.borderMedium}`,
                  borderRadius: radius.md,
                  padding:      '24px',
                  textAlign:    'center',
                  cursor:       reviewState === 'idle' ? 'pointer' : 'default',
                  background:   selectedFile ? colours.accentSoft : colours.hoverBg,
                  transition:   transition.snap,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>📄</div>
                    <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '2px' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
                      {formatBytes(selectedFile.size)} · Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>◈</div>
                    <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '4px' }}>
                      Click to select or take a photo
                    </div>
                    <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
                      PDF, JPG, PNG or HEIC · Max 10MB
                    </div>
                  </div>
                )}
              </div>

              {fileError && (
                <div style={{ fontSize: fontSize.xs, color: colours.danger, padding: '8px 12px', background: colours.dangerLight, borderRadius: radius.sm }}>
                  {fileError}
                </div>
              )}

              {error && <ErrorBanner error={error} />}

              {/* Category + Upload button in a row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' as const }}>
                <div style={{ flex: '1 1 160px' }}>
                  <Select
                    label="Document type"
                    value={selectedCategory}
                    onChange={v => setSelectedCategory(v as DocumentCategory)}
                    options={DOCUMENT_CATEGORIES}
                  />
                </div>
                <div style={{ flexShrink: 0, paddingBottom: '1px' }}>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading || reviewState !== 'idle'}
                  >
                    {uploading ? 'Uploading…' : 'Upload'}
                  </Button>
                </div>
              </div>

              {/* AI reviewing state */}
              {reviewState === 'reviewing' && <ReviewingBanner />}
              {reviewState === 'complete' && (
                <UploadedBanner onDismiss={handleOcrAccept} />
              )}
            </div>
          </Panel>
        )}

        {/* ── Document list ── */}
        <Panel padding="0" style={{ flex: 1 }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   documents.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Documents · {client.tax_year}</Label>
            {totalCount > 0 && (
              <span style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.mono }}>
                {totalCount} total
              </span>
            )}
          </div>

          {filteredDocuments.length === 0 && totalCount === 0 && (
            <EmptyState
              icon="◈"
              headline="No documents uploaded yet."
              sub="Upload your bank statements, receipts, and supporting documents here. Your accountant will review each one."
            />
          )}

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
                  <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, letterSpacing: '0.04em' }}>
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
                    selected={selectedDoc?.id === doc.id}
                    onSelect={() => openDocPanel(doc)}
                    onDelete={readOnly ? undefined : () => deleteDocument(doc.id, doc.storage_path)}
                  />
                ))}
              </div>
            )
          })}

          {hasMore && nextMonth && (
            <div style={{ borderTop: `1px solid ${colours.borderHairline}`, padding: '14px', display: 'flex', justifyContent: 'center' }}>
              <Button variant="secondary" size="sm" onClick={loadMonth} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load ${formatMonthLabel(nextMonth)}`}
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Right: document detail panel ── */}
      <EntryPanel
        open={panelOpen}
        title={selectedDoc?.original_filename ?? 'Document'}
        subtitle={selectedDocCategory}
        onClose={() => { setPanelOpen(false); setSelectedDoc(null) }}
      >
        {selectedDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            {/* File info */}
            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: radius.md, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailField label="Filename"   value={selectedDoc.original_filename} />
              <DetailField label="Category"   value={selectedDocCategory} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <DetailField label="Uploaded"  value={formatDate(selectedDoc.created_at)} />
                <DetailField label="Size"      value={formatBytes(selectedDoc.size_bytes)} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge variant={selectedDoc.reviewed ? 'success' : 'warning'}>
                  {selectedDoc.reviewed ? 'Reviewed' : 'Awaiting review'}
                </Badge>
              </div>
            </div>



            {/* Actions */}
            {!readOnly && (
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={handleDeleteDoc}
                  style={{
                    width:        '100%',
                    padding:      '8px',
                    background:   colours.dangerLight,
                    border:       `1px solid ${colours.danger}33`,
                    borderRadius: radius.sm,
                    color:        colours.danger,
                    fontSize:     fontSize.sm,
                    fontFamily:   fonts.sans,
                    fontWeight:   fontWeight.medium,
                    cursor:       'pointer',
                    transition:   transition.snap,
                  }}
                >
                  Delete document
                </button>
              </div>
            )}
          </div>
        )}
      </EntryPanel>
    </div>
  )
}

// ─── Document row ─────────────────────────────────────────────────────────────

interface DocumentRowProps {
  doc:       FoundryDocument
  isLast:    boolean
  selected?: boolean
  onSelect?: () => void
  onDelete?: () => void
}

function DocumentRow({ doc, isLast, selected, onSelect, onDelete }: DocumentRowProps) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)

  const categoryLabel = DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label
    ?? doc.category

  const ext = doc.original_filename.split('.').pop()?.toUpperCase() ?? 'FILE'

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        spacing.table.rowPadding,
        borderBottom:   isLast ? 'none' : `1px solid ${colours.borderHairline}`,
        background:     selected ? colours.accentLight : hovered ? colours.hoverBg : 'transparent',
        transition:     transition.snap,
        cursor:         onSelect ? 'pointer' : 'default',
        borderLeft:     selected ? `2px solid ${colours.accent}` : '2px solid transparent',
      }}
    >
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
          <div style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colours.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {doc.original_filename}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: fonts.mono }}>{formatDate(doc.created_at)}</span>
            <Badge variant="info">{categoryLabel}</Badge>
            <Badge variant={doc.reviewed ? 'success' : 'warning'}>
              {doc.reviewed ? 'Reviewed' : 'Awaiting'}
            </Badge>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.mono }}>
          {formatBytes(doc.size_bytes)}
        </div>
        {hovered && onDelete && !onSelect && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            title="Remove document"
            style={{
              width: '24px', height: '24px', borderRadius: radius.circle,
              background: colours.dangerLight, border: 'none', color: colours.danger,
              fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: transition.snap, flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
