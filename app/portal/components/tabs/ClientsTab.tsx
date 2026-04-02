'use client'

/**
 * app/portal/components/tabs/ClientsTab.tsx
 *
 * Client/counterparty directory — businesses and individuals you've invoiced.
 * Linked to Invoices tab for quick client-based filtering.
 */

import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { Panel, Label, EmptyState } from '../ui'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

interface ContactEntry {
  id:       string
  name:     string
  type:     'business' | 'individual'
  email?:   string
  invoices: number
  total:    number   // pence
}

const DEMO_CONTACTS: ContactEntry[] = [
  { id: '1', name: 'Acme Ltd',            type: 'business',   email: 'billing@acme.co.uk',        invoices: 4, total: 840000  },
  { id: '2', name: 'Blue Sky Media',      type: 'business',   email: 'accounts@bluesky.co.uk',    invoices: 2, total: 360000  },
  { id: '3', name: 'Parkside Properties', type: 'business',   email: 'admin@parkside.com',         invoices: 6, total: 720000  },
  { id: '4', name: 'James Thornton',      type: 'individual', email: 'jthornton@email.com',        invoices: 1, total: 75000   },
]

function ContactRow({ contact, isLast }: { contact: ContactEntry; isLast: boolean }) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)
  const initial = contact.name.charAt(0).toUpperCase()

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
        cursor:         'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div style={{
          width:          '36px',
          height:         '36px',
          borderRadius:   contact.type === 'business' ? radius.sm : radius.circle,
          background:     colours.accentLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       fontSize.base,
          fontWeight:     fontWeight.semibold,
          color:          colours.accent,
          flexShrink:     0,
        }}>
          {initial}
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
            {contact.name}
          </div>
          {contact.email && (
            <div style={{
              fontSize:   fontSize.xs,
              color:      colours.textMuted,
              marginTop:  '2px',
              fontFamily: fonts.mono,
              overflow:   'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}>
              {contact.email}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        <div style={{
          fontFamily:  fonts.mono,
          fontSize:    fontSize.base,
          fontWeight:  fontWeight.semibold,
          color:       colours.textPrimary,
        }}>
          £{(contact.total / 100).toLocaleString('en-GB')}
        </div>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
          {contact.invoices} invoice{contact.invoices !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

export default function ClientsTab({ client: _client }: { client: Client }) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search clients…') }, [setPlaceholder])

  const filtered = DEMO_CONTACTS.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>
      <Panel padding="0">
        <div style={{
          padding:      `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          borderBottom: `1px solid ${colours.borderHairline}`,
        }}>
          <Label>Clients & contacts</Label>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon="◎"
            headline="No clients yet."
            sub="Clients are automatically added when you create invoices. Start by creating your first invoice."
          />
        )}

        {filtered.map((contact, idx) => (
          <ContactRow
            key={contact.id}
            contact={contact}
            isLast={idx === filtered.length - 1}
          />
        ))}
      </Panel>
    </div>
  )
}
