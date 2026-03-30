'use client'

/**
 * app/portal/components/tabs/DocumentsTab.tsx
 *
 * Documents tab — upload and view documents for the current tax year.
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
  { value: 'bank_statement',         label: 'Bank statement' },
  { value: 'mortgage_statement',     label: 'Mortgage statement' },
  { value: 'tenancy_agreement',      label: 'Tenancy agreement' },
  { value: 'insurance',              label: 'Insurance certificate' },
  { value: 'invoice',                label: 'Invoice' },
  { value: 'receipt',                label: 'Receipt' },
  { value: 'p60',                    label: 'P60' },
  { value: 'p45',                    label: 'P45' },
  { value: 'sa302',                  label: 'SA302 tax calculation' },
  { value: 'letting_agent_statement',label: 'Letting agent statement' },
  { value: 'cis_statement',          label: 'CIS statement' },
  { value: 'contracts',              label: 'Contract' },
  { value: 'other',                  label: 'Other document' },
]

// ─── File type config ─────────────────────────────────────────────────────────

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.heic'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client: Client
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentsTab({ client }: Props) {
  const fileInputRef                    = useRef<HTMLInputElement>(null)
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('other')
  const [fileError,      setFileError]      = useState<string | null>(null)

  const {
    documents,
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

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Upload panel ── */}
      <Panel>
        <Label>Upload document · {client.tax_year}</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>

          {/* Hidden file input — triggered by button below */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Drop zone / file selector */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border:         `2px dashed ${selectedFile ? colours.accent : colours.borderMedium}`,
              borderRadius:   radius.md,
              padding:        '24px',
              textAlign:      'center',
              cursor:         'pointer',
              background:     selectedFile ? colours.accentSoft : colours.hoverBg,
              transition:     transition.snap,
            }}
          >
            {selectedFile ? (
              <div>
                <div style={{
                  fontSize:   fontSize.base,
                  fontWeight: fontWeight.medium,
                  color:      colours.textPrimary,
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
                <div style={{
                  fontSize:     '24px',
                  marginBottom: '8px',
                  opacity:      0.3,
                }}>
                  ◈
                </div>
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
              fontSize:  fontSize.xs,
              color:     colours.danger,
              padding:   '8px 12px',
              background: colours.dangerLight,
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

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading…' : 'Upload document'}
          </Button>
        </div>
      </Panel>

      {/* ── Document list ── */}
      <Panel padding="0">
        <div style={{
          padding:      `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          borderBottom: documents.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
        }}>
          <Label>Documents · {client.tax_year}</Label>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            icon="◈"
            headline="No documents uploaded yet."
            sub="Upload your bank statements, receipts, and supporting documents here. Your accountant will review each one."
          />
        ) : (
          documents.map((doc, idx) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              isLast={idx === documents.length - 1}
              onDelete={() => deleteDocument(doc.id, doc.storage_path)}
            />
          ))
        )}
      </Panel>
    </div>
  )
}

// ─── Document row ─────────────────────────────────────────────────────────────

interface DocumentRowProps {
  doc:      FoundryDocument
  isLast:   boolean
  onDelete: () => void
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
        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.mono,
        }}>
          {formatBytes(doc.size_bytes)}
        </div>
        {hovered && (
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