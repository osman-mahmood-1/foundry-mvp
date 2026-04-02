'use client'

/**
 * app/portal/components/tabs/ClientsTab.tsx
 *
 * Client/counterparty directory — businesses and individuals you've invoiced.
 * Linked to Invoices tab for quick client-based filtering.
 */

import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { Panel, Label, EmptyState, Button, Input, Select } from '../ui'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'
import EntryPanel from '../ui/EntryPanel'

interface ContactEntry {
  id:       string
  name:     string
  type:     'business' | 'individual'
  email?:   string
  invoices: number
  total:    number   // pence
}

const INITIAL_CONTACTS: ContactEntry[] = [
  { id: '1', name: 'Acme Ltd',            type: 'business',   email: 'billing@acme.co.uk',        invoices: 4, total: 840000  },
  { id: '2', name: 'Blue Sky Media',      type: 'business',   email: 'accounts@bluesky.co.uk',    invoices: 2, total: 360000  },
  { id: '3', name: 'Parkside Properties', type: 'business',   email: 'admin@parkside.com',         invoices: 6, total: 720000  },
  { id: '4', name: 'James Thornton',      type: 'individual', email: 'jthornton@email.com',        invoices: 1, total: 75000   },
]

const TYPE_OPTIONS = [
  { value: 'business',   label: 'Business' },
  { value: 'individual', label: 'Individual' },
]

function ContactRow({ contact, isLast, selected, onSelect }: {
  contact:  ContactEntry
  isLast:   boolean
  selected: boolean
  onSelect: () => void
}) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)
  const initial = contact.name.charAt(0).toUpperCase()

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        padding:      spacing.table.rowPadding,
        borderBottom: isLast ? 'none' : `1px solid ${colours.borderHairline}`,
        background:   selected ? colours.accentLight : hovered ? colours.hoverBg : 'transparent',
        transition:   transition.snap,
        cursor:       'pointer',
        borderLeft:   selected ? `2px solid ${colours.accent}` : '2px solid transparent',
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
              fontSize:     fontSize.xs,
              color:        colours.textMuted,
              marginTop:    '2px',
              fontFamily:   fonts.mono,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap' as const,
            }}>
              {contact.email}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        <div style={{
          fontFamily: fonts.mono,
          fontSize:   fontSize.base,
          fontWeight: fontWeight.semibold,
          color:      colours.textPrimary,
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

interface ClientForm {
  name:  string
  type:  'business' | 'individual'
  email: string
}

const EMPTY_FORM: ClientForm = { name: '', type: 'business', email: '' }

export default function ClientsTab({ client: _client }: { client: Client }) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search clients…') }, [setPlaceholder])

  const [contacts, setContacts]       = useState<ContactEntry[]>(INITIAL_CONTACTS)
  const [panelOpen, setPanelOpen]     = useState(false)
  const [selected, setSelected]       = useState<ContactEntry | null>(null)
  const [form, setForm]               = useState<ClientForm>(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)

  const filtered = contacts.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  )

  const isFormValid = form.name.trim().length > 0

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setPanelOpen(true)
  }

  function openContact(contact: ContactEntry) {
    setSelected(contact)
    setForm({ name: contact.name, type: contact.type, email: contact.email ?? '' })
    setPanelOpen(true)
  }

  async function handleSave(keepOpen: boolean) {
    if (!isFormValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    const next: ContactEntry = {
      id:       Date.now().toString(),
      name:     form.name.trim(),
      type:     form.type,
      email:    form.email.trim() || undefined,
      invoices: 0,
      total:    0,
    }
    setContacts(prev => [next, ...prev])
    setForm(EMPTY_FORM)
    setSaving(false)
    if (!keepOpen) setPanelOpen(false)
  }

  async function handleDelete() {
    if (!selected) return
    setContacts(prev => prev.filter(c => c.id !== selected.id))
    setSelected(null)
    setPanelOpen(false)
  }

  async function handleSaveEdit() {
    if (!selected || !isFormValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    setContacts(prev => prev.map(c =>
      c.id === selected.id
        ? { ...c, name: form.name.trim(), type: form.type, email: form.email.trim() || undefined }
        : c
    ))
    setSaving(false)
    setSelected(null)
    setPanelOpen(false)
  }

  return (
    <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0, flex: 1 }}>
      {/* ── Left: client list ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Panel padding="0" style={{ flex: 1 }}>
          <div style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            padding:      `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom: `1px solid ${colours.borderHairline}`,
          }}>
            <Label>Clients & contacts</Label>
            {!panelOpen && (
              <Button size="sm" onClick={openNew}>+ Add client</Button>
            )}
          </div>

          {filtered.length === 0 && contacts.length === 0 && (
            <EmptyState
              icon="◎"
              headline="No clients yet."
              sub="Add your first client or they'll be created automatically when you raise an invoice."
              action="Add client"
              onAction={openNew}
            />
          )}

          {filtered.map((contact, idx) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              isLast={idx === filtered.length - 1}
              selected={selected?.id === contact.id}
              onSelect={() => openContact(contact)}
            />
          ))}
        </Panel>
      </div>

      {/* ── Right: entry panel ── */}
      <EntryPanel
        open={panelOpen}
        title={selected ? 'Client details' : 'New client'}
        subtitle={selected ? (selected.type === 'business' ? 'Business' : 'Individual') : undefined}
        onClose={() => { setPanelOpen(false); setSelected(null) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
          <Input
            label="Name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder={form.type === 'business' ? 'e.g. Acme Ltd' : 'e.g. James Thornton'}
            autoFocus
          />
          <Select
            label="Type"
            value={form.type}
            onChange={v => setForm(f => ({ ...f, type: v as 'business' | 'individual' }))}
            options={TYPE_OPTIONS}
          />
          <Input
            label="Email (optional)"
            value={form.email}
            onChange={v => setForm(f => ({ ...f, email: v }))}
            placeholder="billing@example.com"
          />

          {selected ? (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={saving || !isFormValid}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button variant="secondary" size="sm" onClick={() => handleSave(true)} disabled={saving || !isFormValid}>
                {saving ? 'Saving…' : 'Add another'}
              </Button>
              <Button size="sm" onClick={() => handleSave(false)} disabled={saving || !isFormValid}>
                {saving ? 'Saving…' : 'Done'}
              </Button>
            </div>
          )}
        </div>
      </EntryPanel>
    </div>
  )
}
