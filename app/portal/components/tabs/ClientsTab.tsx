'use client'

/**
 * app/portal/components/tabs/ClientsTab.tsx
 *
 * Client/counterparty directory — businesses and individuals you've invoiced.
 * Linked to Invoices tab for quick client-based filtering.
 */

import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { Panel, Label, TabHeader, EmptyState, Button, Input, Select } from '../ui'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'
import PersistentSidebar from '../ui/PersistentSidebar'

interface ContactEntry {
  id:       string
  name:     string
  type:     'business' | 'individual'
  email?:   string
  invoices: number
  total:    number   // pence
}

// Clients are stored in state — no seed data. New entries are created via the form.
const INITIAL_CONTACTS: ContactEntry[] = []

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
  const [isAdding,  setIsAdding]      = useState(false)
  const [selected, setSelected]       = useState<ContactEntry | null>(null)
  const [form, setForm]               = useState<ClientForm>(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)

  const filtered = contacts.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  )

  const isFormValid = form.name.trim().length > 0

  function openNew() {
    setSelected(null)
    setIsAdding(true)
    setForm(EMPTY_FORM)
  }

  function openContact(contact: ContactEntry) {
    if (selected?.id === contact.id) {
      setSelected(null)
      setIsAdding(false)
      return
    }
    setIsAdding(false)
    setSelected(contact)
    setForm({ name: contact.name, type: contact.type, email: contact.email ?? '' })
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
    if (!keepOpen) { setIsAdding(false) }
  }

  async function handleDelete() {
    if (!selected) return
    setContacts(prev => prev.filter(c => c.id !== selected.id))
    setSelected(null)
    setIsAdding(false)
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
    setIsAdding(false)
  }

  const sidebarChildren = (selected || isAdding) ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
      <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder={form.type === 'business' ? 'e.g. Acme Ltd' : 'e.g. James Thornton'} autoFocus />
      <Select label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v as 'business' | 'individual' }))} options={TYPE_OPTIONS} />
      <Input label="Email (optional)" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="billing@example.com" />
      {selected ? (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
          <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          <Button size="sm" onClick={handleSaveEdit} disabled={saving || !isFormValid}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" size="sm" onClick={() => handleSave(true)} disabled={saving || !isFormValid}>{saving ? 'Saving…' : 'Add another'}</Button>
          <Button size="sm" onClick={() => handleSave(false)} disabled={saving || !isFormValid}>{saving ? 'Saving…' : 'Done'}</Button>
        </div>
      )}
    </div>
  ) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minHeight: 0, flex: 1 }}>
      <TabHeader title="Clients" />
      <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0, flex: 1, alignItems: 'stretch' }}>
      {/* ── Left: client list ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Panel padding="0" style={{ flex: 1 }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   `1px solid ${colours.borderHairline}`,
          }}>
            <Label>Clients & contacts</Label>
            <Button size="sm" onClick={openNew}>+ Add client</Button>
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

      {/* ── Right: persistent sidebar — fills remaining height ── */}
      <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <PersistentSidebar
          title={selected ? 'Client details' : 'New client'}
          subtitle={selected ? (selected.type === 'business' ? 'Business' : 'Individual') : undefined}
          intelligenceContext={{ tab: 'clients', taxYear: '', clientId: '' }}
        >
          {sidebarChildren}
        </PersistentSidebar>
      </div>
      </div>
    </div>
  )
}
