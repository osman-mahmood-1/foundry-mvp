'use client'

/**
 * app/admin/components/AdminShell.tsx
 *
 * Dark-themed shell for the platform editor portal.
 *
 * Design principles:
 *   - Dark background — visually distinct from client (light) and accountant (light)
 *   - Collapsible sidebar — toggle between expanded (220px) and icon-only (52px)
 *   - Grouped nav sections with chevron toggles (People, Operations, Settings)
 *   - Sidebar collapse state persisted in localStorage
 *   - All colours from useColours() (ThemeProvider wraps at layout level)
 *   - 4 text sizes only: page title (serif 24px), section label (mono 9px),
 *     body (sans 13px), caption (sans 11px)
 *
 * Inspiration: Shoor dashboard sidebar (images 1–4), breathable spacing (image 5)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname }                from 'next/navigation'
import Link                           from 'next/link'
import type { PlatformEditor }        from '@/types'
import { useColours }                 from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, keyframes } from '@/styles/tokens'
import { spacing }                    from '@/styles/tokens/spacing'

// ─── Nav definition ──────────────────────────────────────────────────────────

interface NavItem {
  id:    string
  label: string
  icon:  string
  href:  string
}

interface NavGroup {
  id:       string
  label:    string
  items:    NavItem[]
  defaultOpen?: boolean
}

const ADMIN_NAV: NavGroup[] = [
  {
    id: 'people',
    label: 'People',
    defaultOpen: true,
    items: [
      { id: 'clients',     label: 'Clients',     icon: '◎', href: '/admin' },
      { id: 'accountants', label: 'Accountants', icon: '◇', href: '/admin/accountants' },
      { id: 'invites',     label: 'Invites',     icon: '✉', href: '/admin/invites' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    defaultOpen: true,
    items: [
      { id: 'audit', label: 'Audit Log', icon: '⊙', href: '/admin/audit' },
    ],
  },
  {
    id: 'config',
    label: 'Settings',
    defaultOpen: false,
    items: [
      { id: 'settings', label: 'Platform',  icon: '⚙', href: '/admin/settings' },
    ],
  },
]

const SIDEBAR_EXPANDED_W  = '220px'
const SIDEBAR_COLLAPSED_W = '52px'
const LS_KEY = 'foundry-admin-sidebar'

// ─── Sidebar toggle button ──────────────────────────────────────────────────

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean
  onClick:   () => void
}) {
  const colours = useColours()

  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      style={{
        width:          '28px',
        height:         '28px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'transparent',
        border:         `1px solid ${colours.borderHairline}`,
        borderRadius:   radius.xs,
        color:          colours.textMuted,
        cursor:         'pointer',
        fontSize:       '11px',
        transition:     transition.snap,
        flexShrink:     0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = colours.hoverBg
        e.currentTarget.style.borderColor = colours.borderMedium
        e.currentTarget.style.color       = colours.textSecondary
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'transparent'
        e.currentTarget.style.borderColor = colours.borderHairline
        e.currentTarget.style.color       = colours.textMuted
      }}
    >
      {collapsed ? '⟩' : '⟨'}
    </button>
  )
}

// ─── Section group with chevron ─────────────────────────────────────────────

function SectionGroup({
  group,
  collapsed: sidebarCollapsed,
  pathname,
}: {
  group:     NavGroup
  collapsed: boolean
  pathname:  string
}) {
  const colours = useColours()
  const [open, setOpen] = useState(group.defaultOpen ?? true)

  // When sidebar collapses, force all groups open so icons show
  const effectiveOpen = sidebarCollapsed ? true : open

  return (
    <div style={{ marginBottom: '6px' }}>
      {/* Section header — hidden when sidebar collapsed */}
      {!sidebarCollapsed && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '6px 10px',
            background:     'transparent',
            border:         'none',
            cursor:         'pointer',
            fontSize:       fontSize.label,
            fontFamily:     fonts.mono,
            letterSpacing:  letterSpacing.wide,
            color:          colours.navGroupLabel,
            textTransform:  'uppercase' as const,
          }}
        >
          <span>{group.label}</span>
          <span style={{
            fontSize:   '8px',
            transition: transition.snap,
            transform:  open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}>
            ▾
          </span>
        </button>
      )}

      {/* Items */}
      {effectiveOpen && group.items.map(item => (
        <NavLink
          key={item.id}
          item={item}
          active={isActive(item, pathname)}
          collapsed={sidebarCollapsed}
        />
      ))}
    </div>
  )
}

// ─── Active state logic ──────────────────────────────────────────────────────

function isActive(item: NavItem, pathname: string): boolean {
  if (item.id === 'clients') {
    return pathname === '/admin' || pathname.startsWith('/admin/clients')
  }
  return pathname.startsWith(item.href)
}

// ─── Nav link ────────────────────────────────────────────────────────────────

function NavLink({
  item,
  active,
  collapsed,
}: {
  item:      NavItem
  active:    boolean
  collapsed: boolean
}) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show tooltip after brief delay when collapsed
  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    if (collapsed) {
      hoverTimeout.current = setTimeout(() => setTooltipVisible(true), 200)
    }
  }, [collapsed])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setTooltipVisible(false)
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <Link
        href={item.href}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            collapsed ? '0' : '9px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding:        collapsed
            ? '9px'
            : `${spacing.sidebar.itemPaddingV} ${spacing.sidebar.itemPaddingH}`,
          borderRadius:   radius.sm,
          background:     active
            ? colours.navActiveBg
            : hovered
              ? colours.hoverBg
              : 'transparent',
          color:          active ? colours.navActive : colours.navInactive,
          fontSize:       fontSize.base,
          fontWeight:     active ? fontWeight.medium : fontWeight.regular,
          marginBottom:   spacing.sidebar.itemGap,
          transition:     transition.snap,
          textDecoration: 'none',
          fontFamily:     fonts.sans,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span style={{
          fontSize: '11px',
          opacity:  active ? 1 : 0.5,
          width:    collapsed ? 'auto' : '14px',
          textAlign: 'center' as const,
          flexShrink: 0,
        }}>
          {item.icon}
        </span>
        {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      </Link>

      {/* Tooltip (collapsed mode only) */}
      {collapsed && tooltipVisible && (
        <div style={{
          position:     'absolute',
          left:         '100%',
          top:          '50%',
          transform:    'translateY(-50%)',
          marginLeft:   '8px',
          padding:      '4px 10px',
          background:   colours.panelBgSolid,
          border:       `1px solid ${colours.borderHairline}`,
          borderRadius: radius.xs,
          fontSize:     fontSize.xs,
          color:        colours.textPrimary,
          fontFamily:   fonts.sans,
          whiteSpace:   'nowrap' as const,
          zIndex:       100,
          boxShadow:    '0 4px 12px rgba(0,0,0,0.40)',
          pointerEvents: 'none',
        }}>
          {item.label}
        </div>
      )}
    </div>
  )
}

// ─── Footer popover ──────────────────────────────────────────────────────────

function FooterPopover({
  editor,
  onClose,
}: {
  editor:  PlatformEditor
  onClose: () => void
}) {
  const colours = useColours()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position:     'absolute',
        bottom:       '100%',
        left:         '6px',
        right:        '6px',
        marginBottom: '8px',
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.panel,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30)',
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
        {editor.email}
      </div>

      <div style={{ padding: '6px' }}>
        <button
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase')
            const { error } = await createClient().auth.signOut()
            if (error) {
              console.error('AUTH_003', error)
              alert('AUTH_003 — Sign-out failed. Clear your browser cookies if needed.')
              return
            }
            window.location.href = '/login'
          }}
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
            color:        colours.danger,
            cursor:       'pointer',
            fontFamily:   fonts.sans,
            textAlign:    'left' as const,
            transition:   transition.snap,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = colours.dangerLight }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: '13px', opacity: 0.6 }}>↪</span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

// ─── Main shell ──────────────────────────────────────────────────────────────

interface Props {
  editor:   PlatformEditor
  children: React.ReactNode
}

export default function AdminShell({ editor, children }: Props) {
  const colours  = useColours()
  const pathname = usePathname()

  // ── Sidebar collapse state ──────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored === 'collapsed') setCollapsed(true)
    } catch { /* SSR / private browsing */ }
  }, [])

  function toggleCollapse() {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(LS_KEY, next ? 'collapsed' : 'expanded') } catch {}
      return next
    })
  }

  const firstName = editor.full_name?.split(' ')[0] ?? 'Editor'
  const initial   = firstName.charAt(0).toUpperCase()

  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      background: colours.pageBg,
      fontFamily: fonts.sans,
      overflow:   'hidden',
    }}>
      <style>{keyframes}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width:         collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
        flexShrink:    0,
        background:    colours.sidebarBg,
        borderRight:   `1px solid ${colours.borderHairline}`,
        display:       'flex',
        flexDirection: 'column',
        zIndex:        10,
        overflow:      'visible',
        position:      'relative',
        transition:    transition.fast,
      }}>

        {/* ── Top bar: brand + collapse toggle ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding:        collapsed ? '16px 12px' : '16px 18px',
          borderBottom:   `1px solid ${colours.borderHairline}`,
          minHeight:      '56px',
          flexShrink:     0,
        }}>
          {!collapsed && (
            <div>
              <div style={{
                fontFamily:   fonts.serif,
                fontSize:     '15px',
                fontWeight:   fontWeight.medium,
                color:        colours.textPrimary,
                lineHeight:   1.2,
                marginBottom: '2px',
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
                Platform
              </div>
            </div>
          )}
          <CollapseToggle collapsed={collapsed} onClick={toggleCollapse} />
        </div>

        {/* ── Nav sections ── */}
        <nav style={{
          padding:   collapsed ? '8px 6px' : `${spacing.sidebar.padding} 10px`,
          flex:      1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {ADMIN_NAV.map(group => (
            <SectionGroup
              key={group.id}
              group={group}
              collapsed={collapsed}
              pathname={pathname}
            />
          ))}
        </nav>

        {/* ── Divider ── */}
        <div style={{
          height:     '1px',
          background: colours.borderHairline,
          margin:     collapsed ? '0 6px' : '0 18px',
          flexShrink: 0,
        }} />

        {/* ── Footer — editor card + popover ── */}
        <div style={{ padding: collapsed ? '6px' : '10px', position: 'relative', flexShrink: 0 }}>
          {popoverOpen && (
            <FooterPopover
              editor={editor}
              onClose={() => setPopoverOpen(false)}
            />
          )}
          <button
            onClick={() => setPopoverOpen(o => !o)}
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap:            collapsed ? '0' : '10px',
              padding:        collapsed ? '8px' : '8px 10px',
              background:     popoverOpen ? colours.hoverBg : 'transparent',
              border:         'none',
              borderRadius:   radius.sm,
              cursor:         'pointer',
              transition:     transition.snap,
              textAlign:      'left' as const,
            }}
            onMouseEnter={e => {
              if (!popoverOpen) e.currentTarget.style.background = colours.hoverBg
            }}
            onMouseLeave={e => {
              if (!popoverOpen) e.currentTarget.style.background = 'transparent'
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width:          '28px',
              height:         '28px',
              borderRadius:   radius.circle,
              background:     colours.accent,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       fontSize.xs,
              color:          '#FFFFFF',
              fontWeight:     fontWeight.semibold,
              flexShrink:     0,
            }}>
              {initial}
            </div>

            {/* Name + role (hidden when collapsed) */}
            {!collapsed && (
              <>
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
                    Editor
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
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex:       1,
        overflowY:  'auto',
        background: colours.pageBg,
        position:   'relative',
        zIndex:     1,
      }}>
        {children}
      </main>
    </div>
  )
}
