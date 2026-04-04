'use client'

/**
 * app/portal/components/mobile/tabs/MobileDocumentsTab.tsx
 *
 * Document list with pull-to-refresh.
 */

import { useState, useRef, useCallback } from 'react'
import type { Client }   from '@/types'
import { useDocuments }  from '@/app/portal/components/tabs/useDocuments'
import { useColours }    from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }        from '@/styles/tokens'

interface Props { client: Client }

const PTR_THRESHOLD = 60

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function MobileDocumentsTab({ client }: Props) {
  const colours = useColours()
  const [refreshing, setRefreshing] = useState(false)
  const [ptrDelta,   setPtrDelta]   = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const triggered = useRef(false)

  const { documents, loading } = useDocuments(client.id, client.tax_year, client.user_id)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    triggered.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setPtrDelta(Math.min(delta * 0.5, PTR_THRESHOLD))
    if (delta > PTR_THRESHOLD && !triggered.current) triggered.current = true
  }, [])

  const handleTouchEnd = useCallback(async () => {
    setPtrDelta(0)
    if (triggered.current) {
      setRefreshing(true)
      await new Promise(r => setTimeout(r, 800))
      setRefreshing(false)
    }
    triggered.current = false
  }, [])

  return (
    <div
      ref={scrollRef}
      style={{ paddingBottom: '24px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(ptrDelta > 0 || refreshing) && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: `${ptrDelta}px`, transition: 'padding-top 0.1s ease' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            border: `2px solid ${colours.textMuted}`, borderTop: '2px solid transparent',
            animation: refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
          }} />
        </div>
      )}

      <div style={{ padding: '20px 16px 16px' }}>
        <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0, marginBottom: '4px' }}>
          Documents
        </h2>
      </div>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center' as const, color: colours.textMuted, fontFamily: fonts.sans }}>Loading…</div>
      ) : documents.length === 0 ? (
        <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
          <div style={{ fontSize: '32px', opacity: 0.25, marginBottom: '12px' }}>◈</div>
          <div style={{ fontFamily: fonts.sans, fontSize: fontSize.base, color: colours.textMuted }}>No documents yet.</div>
        </div>
      ) : (
        <div style={{ margin: '0 16px', borderRadius: radius.lg, border: `1px solid ${colours.cardBorder}`, overflow: 'hidden', background: colours.cardBg }}>
          {documents.map((doc, idx) => (
            <div key={doc.id} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              padding:      '12px 16px',
              borderBottom: idx === documents.length - 1 ? 'none' : `1px solid ${colours.borderHairline}`,
              minHeight:    '56px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: radius.sm,
                background: colours.accentSoft, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
                ◈
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: fonts.sans, fontSize: '14px', fontWeight: fontWeight.medium,
                  color: colours.textPrimary, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '2px',
                }}>
                  {doc.original_filename}
                </div>
                <div style={{ fontFamily: fonts.sans, fontSize: '12px', color: colours.textMuted, fontWeight: 300 }}>
                  {catLabel(doc.category)} · {formatDate(doc.created_at)} · {formatBytes(doc.size_bytes)}
                </div>
              </div>
              {!doc.reviewed && (
                <span style={{
                  padding: '2px 8px', borderRadius: radius.sm,
                  background: colours.warningLight, color: colours.warning,
                  fontSize: '11px', fontFamily: fonts.sans, fontWeight: fontWeight.medium,
                  flexShrink: 0,
                }}>
                  Review
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
