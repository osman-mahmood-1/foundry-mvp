'use client'

/**
 * app/accountant/components/AccountantShell.tsx
 *
 * Client-component shell for the accountant portal.
 * Mirrors the PortalShell pattern: same design tokens, same sidebar structure,
 * different nav items (route-based, not tab-based).
 *
 * Nav items:
 *   ◎ Clients   → /accountant          (active for / and /clients/*)
 *   ◇ Messages  → /accountant/messages
 *
 * Active state is derived from usePathname() — no client-side tab state needed.
 * The main content area renders {children} from the Next.js layout system.
 */

import { useState, useRef, useEffect } from 'react'
import { usePathname }                 from 'next/navigation'
import Link                            from 'next/link'
import type { Accountant }             from '@/types'
import { light as colours }            from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { orbs }                        from '@/styles/tokens/effects'
import { radius, transition, keyframes } from '@/styles/tokens'
import { spacing }                     from '@/styles/tokens/spacing'

// ─── Nav definition ───────────────────────────────────────────────────────────

const ACCOUNTANT_NAV = [
  { id: 'clients',  label: 'Clients',  icon: '◎', href: '/accountant' },
  { id: 'messages', label: 'Messages', icon: '◇', href: '/accountant/messages' },
] as const

type AccountantNavId = typeof ACCOUNTANT_NAV[number]['id']

// ─── Footer popover ───────────────────────────────────────────────────────────

interface FooterPopoverProps {
  accountant: Accountant
  onClose:    () => void
}

function FooterPopover({ accountant, onClose }: FooterPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const menuItem = (
    label: string,
    icon: string,
    onClick: () => void,
    danger = false,
  ) => (
    <button
      onClick={onClick}
      style={{
        width:        '100%',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        padding:      '8px 12px',
        background:   'transparent',
        border:       'none',
        borderRadius: radius.sm,
        fontSize:     fontSize.base,
        color:        danger ? colours.danger : colours.textSecondary,
        cursor:       'pointer',
        fontFamily:   fonts.sans,
        textAlign:    'left' as const,
        transition:   transition.snap,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? colours.dangerLight : colours.hoverBg
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ fontSize: '13px', opacity: 0.6 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div
      ref={ref}
      style={{
        position:     'absolute',
        bottom:       '100%',
        left:         spacing.sidebar.padding,
        right:        spacing.sidebar.padding,
        marginBottom: '8px',
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.panel,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        overflow:     'hidden',
        zIndex:       50,
        animation:    'fadeUp 0.2s ease',
      }}
    >
      <div style={{
        padding:      '12px 14px',
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        fontFamily:   fonts.mono,
        borderBottom: `1px solid ${colours.borderHairline}`,
      }}>
        {accountant.email}
      </div>

      <div style={{ padding: '6px' }}>
        {menuItem('Sign out', '↪', async () => {
          const { createClient } = await import('@/lib/supabase')
          const { error } = await createClient().auth.signOut()
          if (error) {
            console.error('AUTH_003', error)
            alert(`AUTH_003 — Sign-out failed. Clear your browser cookies if needed.`)
            return
          }
          window.location.href = '/login'
        })}
      </div>
    </div>
  )
}

// ─── Nav link with hover ──────────────────────────────────────────────────────

interface NavLinkProps {
  href:   string
  active: boolean
  icon:   string
  label:  string
}

function NavLink({ href, active, icon, label }: NavLinkProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '9px',
        padding:      `${spacing.sidebar.itemPaddingV} ${spacing.sidebar.itemPaddingH}`,
        borderRadius: radius.sm,
        background:   active
                        ? colours.navActiveBg
                        : hovered
                          ? colours.hoverBg
                          : 'transparent',
        color:        active ? colours.navActive : colours.navInactive,
        fontSize:     fontSize.base,
        fontWeight:   active ? fontWeight.medium : fontWeight.regular,
        marginBottom: spacing.sidebar.itemGap,
        transition:   transition.snap,
        textDecoration: 'none',
        fontFamily:   fonts.sans,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: '11px', opacity: active ? 1 : 0.5 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface Props {
  accountant: Accountant
  children:   React.ReactNode
}

export default function AccountantShell({ accountant, children }: Props) {
  const pathname         = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const firstName = accountant.full_name?.split(' ')[0] ?? 'there'
  const initial   = firstName.charAt(0).toUpperCase()

  function isActive(href: string, id: AccountantNavId): boolean {
    if (id === 'clients') {
      return pathname === '/accountant' || pathname.startsWith('/accountant/clients')
    }
    return pathname.startsWith(href)
  }

  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      background: colours.pageBg,
      fontFamily: fonts.sans,
      overflow:   'hidden',
    }}>
      <style>{keyframes}</style>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', ...orbs.blueTopRight }} />
        <div style={{ position: 'absolute', ...orbs.skyBottomLeft }} />
      </div>

      {/* ── Sidebar ── */}
      <aside style={{
        width:         '220px',
        flexShrink:    0,
        margin:        '12px 0 12px 12px',
        background:    colours.sidebarBg,
        borderRadius:  radius.sidebar,
        boxShadow:     `0 0 0 1px ${colours.borderHairline}, 0 4px 24px ${colours.sidebarShadow}`,
        display:       'flex',
        flexDirection: 'column',
        zIndex:        10,
        overflow:      'visible',
        position:      'relative',
      }}>

        {/* Portal identity */}
        <div style={{
          padding:      `${spacing.sidebar.userPadding} 18px 18px`,
          borderRadius: `${radius.sidebar} ${radius.sidebar} 0 0`,
          overflow:     'hidden',
        }}>
          <div style={{
            fontFamily:  fonts.serif,
            fontSize:    '15px',
            fontWeight:  fontWeight.medium,
            color:       colours.textPrimary,
            lineHeight:  1.2,
            marginBottom: '4px',
          }}>
            Tax Foundry
          </div>
          <div style={{
            fontSize:      fontSize.label,
            color:         colours.textMuted,
            fontFamily:    fonts.mono,
            letterSpacing: letterSpacing.wide,
            textTransform: 'uppercase' as const,
          }}>
            Accountant Portal
          </div>
        </div>

        <div style={{ height: '1px', background: colours.borderHairline, margin: '0 18px' }} />

        {/* Nav */}
        <nav style={{
          padding:   `${spacing.sidebar.padding} 10px`,
          flex:      1,
          overflowY: 'auto',
        }}>
          {ACCOUNTANT_NAV.map(item => (
            <NavLink
              key={item.id}
              href={item.href}
              active={isActive(item.href, item.id)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div style={{ height: '1px', background: colours.borderHairline, margin: '0 18px' }} />

        {/* Footer — accountant card + popover */}
        <div style={{ padding: '10px', position: 'relative' }}>
          {popoverOpen && (
            <FooterPopover
              accountant={accountant}
              onClose={() => setPopoverOpen(false)}
            />
          )}
          <button
            onClick={() => setPopoverOpen(o => !o)}
            style={{
              width:        '100%',
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '8px 10px',
              background:   popoverOpen ? colours.hoverBg : 'transparent',
              border:       'none',
              borderRadius: radius.sm,
              cursor:       'pointer',
              transition:   transition.snap,
              textAlign:    'left' as const,
            }}
            onMouseEnter={e => {
              if (!popoverOpen) e.currentTarget.style.background = colours.hoverBg
            }}
            onMouseLeave={e => {
              if (!popoverOpen) e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              width:          '28px',
              height:         '28px',
              borderRadius:   radius.circle,
              background:     colours.accent,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       fontSize.xs,
              color:          colours.textInverse,
              fontWeight:     fontWeight.semibold,
              flexShrink:     0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize:     fontSize.sm,
                fontWeight:   fontWeight.medium,
                color:        colours.textPrimary,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap' as const,
              }}>
                {firstName}
              </div>
              <div style={{
                fontSize:   fontSize.xs,
                color:      colours.textMuted,
                fontFamily: fonts.mono,
              }}>
                Accountant
              </div>
            </div>
            <span style={{
              fontSize:   '10px',
              color:      colours.textMuted,
              transform:  popoverOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: transition.snap,
            }}>
              ⌃
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex:      1,
        overflowY: 'auto',
        padding:   '12px 12px 12px 10px',
        position:  'relative',
        zIndex:    1,
      }}>
        {children}
      </main>
    </div>
  )
}
