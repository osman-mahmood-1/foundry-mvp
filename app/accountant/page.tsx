/**
 * app/accountant/page.tsx
 *
 * Server component — accountant's home screen.
 * Fetches all clients assigned to the accountant and renders an
 * urgency-sorted client list.
 *
 * Urgency sort order (per implementation plan §7.1):
 *   1. Clients with unread messages (they're waiting)
 *   2. Clients with SA deadline within 30 days
 *   3. Clients with pending expense reviews
 *   4. Clients with unreviewed documents
 *   5. All others — alphabetical
 *
 * Data strategy: admin client for multi-table joins (server-only, identity
 * already verified in layout.tsx). accountant_id is sourced from the
 * verified JWT claim — never from query params or request body.
 *
 * force-dynamic: always server-rendered on demand.
 */

import { redirect }           from 'next/navigation'
import Link                   from 'next/link'
import { createClient }       from '@/lib/supabase-server'
import { createAdminClient }  from '@/lib/supabase-admin'
import { getAccountantId }    from '@/lib/roles'
import { light as colours }   from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glassStatic }        from '@/styles/tokens/effects'
import { radius, transition } from '@/styles/tokens'
import { spacing }            from '@/styles/tokens/spacing'
import type { Client }        from '@/types'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientWithUrgency {
  client:           Client
  unreadMessages:   number
  pendingReviews:   number
  unreviewedDocs:   number
  saDaysRemaining:  number | null    // null = no SA deadline found
  urgencyTier:      0 | 1 | 2 | 3 | 4  // 0 = most urgent
}

type UrgencyColour = 'red' | 'amber' | 'green'

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function getUrgencyColour(item: ClientWithUrgency): UrgencyColour {
  if (item.unreadMessages > 0) return 'red'
  if (item.saDaysRemaining !== null && item.saDaysRemaining <= 30) return 'amber'
  if (item.pendingReviews > 0 || item.unreviewedDocs > 0)          return 'amber'
  return 'green'
}

const URGENCY_DOT: Record<UrgencyColour, string> = {
  red:   colours.danger,
  amber: '#F59E0B',
  green: '#10B981',
}

function urgencyTier(item: ClientWithUrgency): 0 | 1 | 2 | 3 | 4 {
  if (item.unreadMessages > 0) return 0
  if (item.saDaysRemaining !== null && item.saDaysRemaining <= 30) return 1
  if (item.pendingReviews > 0) return 2
  if (item.unreviewedDocs > 0) return 3
  return 4
}

function sortByUrgency(items: ClientWithUrgency[]): ClientWithUrgency[] {
  return [...items].sort((a, b) => {
    const tierDiff = a.urgencyTier - b.urgencyTier
    if (tierDiff !== 0) return tierDiff
    // Within same tier: sort by SA deadline proximity (closest first), then alphabetically
    if (a.saDaysRemaining !== null && b.saDaysRemaining !== null) {
      const daysDiff = a.saDaysRemaining - b.saDaysRemaining
      if (daysDiff !== 0) return daysDiff
    }
    return (a.client.full_name ?? '').localeCompare(b.client.full_name ?? '')
  })
}

// ─── Client card ─────────────────────────────────────────────────────────────

function ClientCard({ item }: { item: ClientWithUrgency }) {
  const colour     = getUrgencyColour(item)
  const dotColour  = URGENCY_DOT[colour]
  const firstName  = item.client.full_name ?? 'Unknown'
  const plan       = (item.client.plan ?? 'foundation')

  const subtitleParts: string[] = []
  if (item.unreadMessages > 0) {
    subtitleParts.push(`${item.unreadMessages} unread message${item.unreadMessages !== 1 ? 's' : ''}`)
  }
  if (item.saDaysRemaining !== null) {
    subtitleParts.push(`SA due in ${item.saDaysRemaining} days`)
  }
  if (item.pendingReviews > 0) {
    subtitleParts.push(`${item.pendingReviews} expense${item.pendingReviews !== 1 ? 's' : ''} to review`)
  }
  if (item.unreviewedDocs > 0) {
    subtitleParts.push(`${item.unreviewedDocs} document${item.unreviewedDocs !== 1 ? 's' : ''} pending`)
  }
  if (subtitleParts.length === 0) subtitleParts.push('Up to date')

  return (
    <Link
      href={`/accountant/clients/${item.client.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        style={{
          ...glassStatic.panel,
          padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          display:        'flex',
          alignItems:     'center',
          gap:            '14px',
          marginBottom:   '10px',
          cursor:         'pointer',
          transition:     transition.snap,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            `0 0 0 1.5px ${colours.accent}40, 0 4px 16px rgba(0,0,0,0.08)`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = (glassStatic.panel as Record<string, string>).boxShadow ?? ''
        }}
      >
        {/* Urgency dot */}
        <div style={{
          width:        '8px',
          height:       '8px',
          borderRadius: '50%',
          background:   dotColour,
          flexShrink:   0,
        }} />

        {/* Avatar */}
        <div style={{
          width:          '36px',
          height:         '36px',
          borderRadius:   radius.circle,
          background:     colours.accent,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       fontSize.sm,
          color:          colours.textInverse,
          fontWeight:     fontWeight.semibold,
          flexShrink:     0,
        }}>
          {firstName.charAt(0).toUpperCase()}
        </div>

        {/* Name + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily:   fonts.sans,
            fontSize:     fontSize.base,
            fontWeight:   fontWeight.medium,
            color:        colours.textPrimary,
            marginBottom: '3px',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap' as const,
          }}>
            {firstName}
          </div>
          <div style={{
            fontSize:     fontSize.sm,
            color:        colours.textMuted,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap' as const,
          }}>
            {subtitleParts.join(' · ')}
          </div>
        </div>

        {/* Plan badge */}
        <div style={{
          fontSize:      fontSize.label,
          fontFamily:    fonts.mono,
          letterSpacing: letterSpacing.wide,
          color:         colours.textMuted,
          background:    colours.borderLight,
          padding:       '2px 7px',
          borderRadius:  radius.xs,
          textTransform: 'uppercase' as const,
          flexShrink:    0,
        }}>
          {plan}
        </div>

        {/* Arrow */}
        <span style={{ fontSize: '12px', color: colours.textMuted, opacity: 0.5 }}>›</span>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountantPage() {
  // ── Identity ──────────────────────────────────────────────────────────────
  const supabase     = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const accountantId = getAccountantId(user)
  if (!accountantId) redirect('/login')

  // ── Data fetch ────────────────────────────────────────────────────────────
  const admin = createAdminClient()

  // 1. Get assigned client IDs
  const { data: assignments } = await admin
    .from('accountant_clients')
    .select('client_id')
    .eq('accountant_id', accountantId)

  const clientIds = (assignments ?? []).map(a => a.client_id as string)

  if (clientIds.length === 0) {
    return <EmptyState />
  }

  // 2. Get client records
  const { data: clientRows } = await admin
    .from('clients')
    .select('*')
    .in('id', clientIds)
    .is('deleted_at', null)

  const clients = (clientRows ?? []) as Client[]

  // 3. Get urgency counts in parallel
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [
    { data: unreadMsgRows },
    { data: deadlineRows },
    { data: pendingReviewRows },
    { data: unreviewedDocRows },
  ] = await Promise.all([
    // Unread messages sent by the client
    admin
      .from('messages')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('read', false)
      .eq('sender_role', 'client'),

    // SA deadlines within 30 days
    admin
      .from('deadlines')
      .select('client_id, deadline_date')
      .in('client_id', clientIds)
      .in('status', ['upcoming'])
      .lte('deadline_date', in30Days)
      .gte('deadline_date', now.toISOString().split('T')[0]),

    // Expenses without a review record
    admin
      .from('expenses')
      .select('client_id')
      .in('client_id', clientIds)
      .is('allowable', null),

    // Documents not yet reviewed
    admin
      .from('documents')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('reviewed', false),
  ])

  // 4. Build urgency maps
  const unreadMap:    Record<string, number> = {}
  const reviewMap:    Record<string, number> = {}
  const docMap:       Record<string, number> = {}
  const deadlineMap:  Record<string, number> = {}

  for (const row of unreadMsgRows    ?? []) { unreadMap[(row as { client_id: string }).client_id]  = (unreadMap[(row as { client_id: string }).client_id]  ?? 0) + 1 }
  for (const row of pendingReviewRows ?? []) { reviewMap[(row as { client_id: string }).client_id]  = (reviewMap[(row as { client_id: string }).client_id]  ?? 0) + 1 }
  for (const row of unreviewedDocRows ?? []) { docMap[(row as { client_id: string }).client_id]     = (docMap[(row as { client_id: string }).client_id]     ?? 0) + 1 }
  for (const row of deadlineRows      ?? []) {
    const r   = row as { client_id: string; deadline_date: string }
    const days = Math.ceil(
      (new Date(r.deadline_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const existing = deadlineMap[r.client_id]
    if (existing === undefined || days < existing) deadlineMap[r.client_id] = days
  }

  // 5. Compose urgency items
  const items: ClientWithUrgency[] = clients.map(client => {
    const item: ClientWithUrgency = {
      client,
      unreadMessages:  unreadMap[client.id]   ?? 0,
      pendingReviews:  reviewMap[client.id]   ?? 0,
      unreviewedDocs:  docMap[client.id]      ?? 0,
      saDaysRemaining: deadlineMap[client.id] ?? null,
      urgencyTier:     0,
    }
    item.urgencyTier = urgencyTier(item)
    return item
  })

  const sorted = sortByUrgency(items)

  // ── Render ──────────────────────────────────────────────────────────────
  const urgentCount = sorted.filter(i => i.urgencyTier <= 1).length

  return (
    <div style={{ maxWidth: '720px', animation: 'fadeUp 0.4s ease' }}>

      {/* Page header */}
      <div style={{ marginBottom: '28px', padding: '4px' }}>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.textMuted,
          fontFamily:    fonts.mono,
          letterSpacing: letterSpacing.widest,
          textTransform: 'uppercase' as const,
          marginBottom:  '4px',
        }}>
          Your clients
        </div>
        <h1 style={{
          fontFamily: fonts.sans,
          fontSize:   '26px',
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
          lineHeight: 1.2,
          margin:     0,
        }}>
          {urgentCount > 0
            ? `${urgentCount} client${urgentCount !== 1 ? 's' : ''} need attention.`
            : `${clients.length} client${clients.length !== 1 ? 's' : ''}.`}
        </h1>
      </div>

      {/* Client list */}
      <div>
        {sorted.map(item => (
          <ClientCard key={item.client.id} item={item} />
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      ...glassStatic.panel,
      padding:        '48px',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '400px',
      textAlign:      'center',
      maxWidth:       '480px',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '16px', opacity: 0.2 }}>◎</div>
      <div style={{
        fontFamily:   fonts.sans,
        fontSize:     '20px',
        fontWeight:   fontWeight.medium,
        color:        colours.textPrimary,
        marginBottom: '8px',
      }}>
        No clients assigned yet
      </div>
      <div style={{
        fontSize:   fontSize.base,
        color:      colours.textMuted,
        lineHeight: 1.6,
      }}>
        A platform editor will assign clients to you shortly.
      </div>
    </div>
  )
}
