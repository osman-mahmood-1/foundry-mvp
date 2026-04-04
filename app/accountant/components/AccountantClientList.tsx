'use client'

import Link                          from 'next/link'
import { useEffect }                 from 'react'
import { useColours, useThemeMode }  from '@/styles/ThemeContext'
import { useShellSearch }            from '@/app/components/shells/BaseShell'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glass }                     from '@/styles/tokens/effects'
import { radius, transition }        from '@/styles/tokens'
import { spacing }                   from '@/styles/tokens/spacing'
import type { Client }               from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientWithUrgency {
  client:           Client
  unreadMessages:   number
  pendingReviews:   number
  unreviewedDocs:   number
  saDaysRemaining:  number | null
  urgencyTier:      0 | 1 | 2 | 3 | 4
}

type UrgencyColour = 'red' | 'amber' | 'green'

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function getUrgencyColour(item: ClientWithUrgency): UrgencyColour {
  if (item.unreadMessages > 0) return 'red'
  if (item.saDaysRemaining !== null && item.saDaysRemaining <= 30) return 'amber'
  if (item.pendingReviews > 0 || item.unreviewedDocs > 0)          return 'amber'
  return 'green'
}

function urgencyDotColour(colour: UrgencyColour, c: { danger: string; warningDark: string; income: string }): string {
  if (colour === 'red')   return c.danger
  if (colour === 'amber') return c.warningDark
  return c.income
}

// ─── Client card ─────────────────────────────────────────────────────────────

function ClientCard({ item }: { item: ClientWithUrgency }) {
  const colours    = useColours()
  const mode       = useThemeMode()
  const colour     = getUrgencyColour(item)
  const dotColour  = urgencyDotColour(colour, colours)
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
          ...glass.card(mode),
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
          const base = glass.card(mode)
          ;(e.currentTarget as HTMLElement).style.boxShadow = (base as Record<string, string>).boxShadow ?? ''
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const colours = useColours()
  const mode = useThemeMode()
  return (
    <div style={{
      ...glass.card(mode),
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

// ─── Main export ──────────────────────────────────────────────────────────────

interface AccountantClientListProps {
  sorted:       ClientWithUrgency[]
  totalClients: number
}

export default function AccountantClientList({ sorted, totalClients }: AccountantClientListProps) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search clients…') }, [setPlaceholder])

  const filteredSorted = sorted.filter(item =>
    !query || item.client.full_name?.toLowerCase().includes(query.toLowerCase())
  )

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
            : `${totalClients} client${totalClients !== 1 ? 's' : ''}.`}
        </h1>
      </div>

      {/* Client list */}
      <div>
        {filteredSorted.map(item => (
          <ClientCard key={item.client.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export { EmptyState }
export type { ClientWithUrgency }
