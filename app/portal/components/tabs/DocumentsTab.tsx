'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../../../lib/supabase'
import { Panel, Label, EmptyState, Spinner, formatDate } from '../ui'

const CATEGORIES = [
  { value: 'bank_statement',          label: 'Bank statement' },
  { value: 'mortgage_statement',      label: 'Mortgage statement' },
  { value: 'tenancy_agreement',       label: 'Tenancy agreement' },
  { value: 'insurance',               label: 'Insurance certificate' },
  { value: 'invoice',                 label: 'Invoice' },
  { value: 'receipt',                 label: 'Receipt' },
  { value: 'p60',                     label: 'P60' },
  { value: 'p45',                     label: 'P45' },
  { value: 'letting_agent_statement', label: 'Letting agent statement' },
  { value: 'cis_statement',           label: 'CIS statement' },
  { value: 'contracts',               label: 'Contract' },
  { value: 'other',                   label: 'Other — not sure' },
]

const MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function DocumentsTab({ client, navy, teal, muted, secondary }: any) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('other')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!client?.id) return
    loadDocuments()
  }, [client])

  async function loadDocuments() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
    setDocuments(data ?? [])
    setLoading(false)
  }

  async function uploadFile(file: File) {
    if (!MIME_TYPES.includes(file.type)) {
      alert('File type not supported. Please upload PDF, JPG, PNG, XLSX or CSV.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.')
      return
    }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${client.tax_year}/${category}/${timestamp}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .upload(path, file, { contentType: file.type })

    if (storageError) {
      alert('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    await supabase.from('documents').insert({
      client_id: client.id,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      category,
      tax_year: client.tax_year,
      uploaded_by: user.id,
    })

    setUploading(false)
    loadDocuments()
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    Array.from(files).forEach(uploadFile)
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Upload panel */}
      <Panel padding="24px">
        <Label>Upload documents · {client.tax_year}</Label>

        {/* Category selector */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: secondary, display: 'block', marginBottom: '6px' }}>
            Document type
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '5px 12px',
                  background: category === c.value ? navy : 'rgba(5,28,44,0.04)',
                  color: category === c.value ? 'white' : secondary,
                  border: `1px solid ${category === c.value ? navy : 'rgba(5,28,44,0.1)'}`,
                  borderRadius: '100px',
                  fontSize: '11px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? teal : 'rgba(5,28,44,0.15)'}`,
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(0,212,170,0.03)' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.3 }}>☁</div>
          <div style={{ fontSize: '13px', color: navy, fontWeight: '500', marginBottom: '4px' }}>
            {uploading ? 'Uploading...' : 'Drop files here, or tap to browse'}
          </div>
          <div style={{ fontSize: '11px', color: muted }}>
            PDF, JPG, PNG, XLSX, CSV · Max 10MB per file
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
            capture="environment"
          />
        </div>
      </Panel>

      {/* Documents list */}
      <Panel padding="0">
        {documents.length === 0 ? (
          <EmptyState
            icon="□"
            headline="Your vault is empty."
            sub="Every document you upload is stored securely and made available to your accountant. Start with your most recent bank statement."
          />
        ) : (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 80px 90px 80px',
              padding: '12px 20px', borderBottom: '1px solid rgba(5,28,44,0.06)',
            }}>
              {['Filename', 'Category', 'Size', 'Uploaded', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '10px', color: muted, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {h}
                </div>
              ))}
            </div>
            {documents.map((doc, idx) => (
              <div key={doc.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 80px 90px 80px',
                padding: '12px 20px',
                borderBottom: idx < documents.length - 1 ? '1px solid rgba(5,28,44,0.05)' : 'none',
                alignItems: 'center',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(5,28,44,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontSize: '13px', color: navy, fontWeight: '500' }}>
                  {doc.original_filename}
                </div>
                <div>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px',
                    background: 'rgba(5,28,44,0.05)', color: secondary,
                    borderRadius: '100px', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {CATEGORIES.find(c => c.value === doc.category)?.label ?? doc.category}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatBytes(doc.size_bytes)}
                </div>
                <div style={{ fontSize: '11px', color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatDate(doc.created_at)}
                </div>
                <div>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '100px',
                    fontFamily: "'JetBrains Mono', monospace",
                    background: doc.reviewed ? 'rgba(0,212,170,0.08)' : 'rgba(245,158,11,0.08)',
                    color: doc.reviewed ? '#00856A' : '#D97706',
                  }}>
                    {doc.reviewed ? 'Reviewed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
