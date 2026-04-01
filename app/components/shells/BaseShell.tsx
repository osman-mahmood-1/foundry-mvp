'use client'

/**
 * app/components/shells/BaseShell.tsx
 *
 * Shared layout primitive for all Foundry portals.
 * Replaces the ~70% duplication between PortalShell, AccountantShell, AdminShell.
 *
 * Features:
 * - Theme-aware via useColours() — works for light (portal/accountant) + dark (admin)
 * - Tab-based nav (PortalShell) via activeId + onNavSelect
 * - Route-based nav (Accountant/Admin) via href on items + pathname matching
 * - Collapsible sidebar with localStorage persistence
 * - 'floating' (pill sidebar, portal/accountant) vs 'docked' (admin) styles
 * - Coming-soon badges on nav items
 * - Grouped nav sections with optional chevron toggles
 * - Footer popover with arbitrary action items
 * - Background orbs (light portals only)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname }   from 'next/navigation'
import Link              from 'next/link'
import { useColours }    from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, keyframes } from '@/styles/tokens'
import { spacing }       from '@/styles/tokens/spacing'
import { orbs as orbStyles } from '@/styles/tokens/effects'

// ─── Public types (re-exported so callers can type their nav configs) ────────

export interface ShellNavItem {
  id:          string
  label:       string
  icon:        string
  href?:       string       // present = route-based <Link>; absent = tab button
  comingSoon?: boolean
}

export interface ShellNavGroup {
  id:           string
  label:        string      // empty string = no label shown
  items:        ShellNavItem[]
  collapsible?: boolean     // whether the group header shows a chevron toggle
  defaultOpen?: boolean
}

export interface ShellFooterItem {
  label:        string
  icon:         string
  onClick:      () => void | Promise<void>
  danger?:      boolean
  dividerAbove?: boolean
}

export interface BaseShellProps {
  /** Content rendered in the top section of the sidebar (avatar/brand/etc.) */
  topBarContent:  React.ReactNode
  /** Footer user card identity */
  footerIdentity: { name: string; subtitle: string; avatarLetter: string }
  email:          string
  footerItems:    ShellFooterItem[]
  navGroups:      ShellNavGroup[]
  children:       React.ReactNode
  /** Show collapse toggle and persist state to localStorage */
  collapsible?:   boolean
  storageKey?:    string
  /** Show background gradient orbs (light portals only) */
  showOrbs?:      boolean
  /** 'floating' = pill sidebar with margin + radius (portal/accountant)
   *  'docked'   = flush sidebar with border-right (admin) */
  sidebarStyle?:  'floating' | 'docked'
  /** Currently active nav item (for tab-based portals) */
  activeId?:      string
  /** Called when a tab-based nav item is clicked */
  onNavSelect?:   (id: string) => void
}

const EXPANDED_W  = '220px'
const COLLAPSED_W = '52px'

// ─── FooterPopover ───────────────────────────────────────────────────────────

function FooterPopover({
  email,
  items,
  onClose,
  inset,
}: {
  email:   string
  items:   ShellFooterItem[]
  onClose: () => void
  inset:   string
}) {
  const colours = useColours()
  const ref     = useRef<HTMLDivElement>(null)

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
        left:         inset,
        right:        inset,
        marginBottom: '8px',
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.panel,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        overflow:     'hidden',
        zIndex:       50,
        animation:    'fadeUp 0.2s ease',
        minWidth:     '160px',
      }}
    >
      <div style={{
        padding:      '12px 14px',
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        fontFamily:   fonts.mono,
        borderBottom: `1px solid ${colours.borderHairline}`,
      }}>
        {email}
      </div>

      {items.map((item, i) => (
        <div key={i}>
          {item.dividerAbove && (
            <div style={{ height: '1px', background: colours.borderHairline, margin: '0 12px' }} />
          )}
          <div style={{ padding: '4px 6px' }}>
            <button
              onClick={item.onClick}
              style={{
                width:        '100%',
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
                padding:      '8px 10px',
                background:   'transparent',
                border:       'none',
                borderRadius: radius.sm,
                fontSize:     fontSize.base,
                color:        item.danger ? colours.danger : colours.textSecondary,
                cursor:       'pointer',
                fontFamily:   fonts.sans,
                textAlign:    'left' as const,
                transition:   transition.snap,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = item.danger ? colours.dangerLight : colours.hoverBg
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '13px', opacity: 0.6 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── NavItemRow ──────────────────────────────────────────────────────────────

function NavItemRow({
  item,
  isActive,
  collapsed,
  onSelect,
}: {
  item:      ShellNavItem
  isActive:  boolean
  collapsed: boolean
  onSelect?: (id: string) => void
}) {
  const colours                       = useColours()
  const [hovered, setHovered]         = useState(false)
  const [tooltip, setTooltip]         = useState(false)
  const hoverRef                      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSoon                        = item.comingSoon === true

  const handleEnter = useCallback(() => {
    setHovered(true)
    if (collapsed && !isSoon) {
      hoverRef.current = setTimeout(() => setTooltip(true), 200)
    }
  }, [collapsed, isSoon])

  const handleLeave = useCallback(() => {
    setHovered(false)
    setTooltip(false)
    if (hoverRef.current) { clearTimeout(hoverRef.current); hoverRef.current = null }
  }, [])

  const style: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap:            collapsed ? '0' : '9px',
    padding:        collapsed
      ? '9px'
      : `${spacing.sidebar.itemPaddingV} ${spacing.sidebar.itemPaddingH}`,
    borderRadius:   radius.sm,
    background:     isActive
      ? colours.navActiveBg
      : (hovered && !isSoon ? colours.hoverBg : 'transparent'),
    color:          isSoon
      ? colours.textMuted
      : isActive ? colours.navActive : colours.navInactive,
    fontSize:       fontSize.base,
    fontWeight:     isActive ? fontWeight.medium : fontWeight.regular,
    marginBottom:   spacing.sidebar.itemGap,
    transition:     transition.snap,
    textDecoration: 'none',
    fontFamily:     fonts.sans,
    opacity:        isSoon ? 0.45 : 1,
    cursor:         isSoon ? 'default' : 'pointer',
    width:          '100%',
    textAlign:      'left' as const,
    border:         'none',
    boxSizing:      'border-box' as const,
  }

  const inner = (
    <>
      <span style={{
        fontSize:   '11px',
        opacity:    isActive ? 1 : 0.5,
        width:      collapsed ? 'auto' : '14px',
        textAlign:  'center' as const,
        flexShrink: 0,
      }}>
        {item.icon}
      </span>
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && isSoon && (
        <span style={{
          fontSize:      '8px',
          fontFamily:    fonts.mono,
          letterSpacing: '0.06em',
          color:         colours.textMuted,
          background:    colours.borderLight,
          padding:       '1px 5px',
          borderRadius:  radius.xs,
          textTransform: 'uppercase' as const,
        }}>
          Soon
        </span>
      )}
    </>
  )

  return (
    <div style={{ position: 'relative' }}>
      {item.href && !isSoon ? (
        <Link href={item.href} style={style} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
          {inner}
        </Link>
      ) : (
        <button
          style={style}
          onClick={() => !isSoon && onSelect?.(item.id)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {inner}
        </button>
      )}

      {/* Tooltip shown when sidebar is collapsed */}
      {collapsed && tooltip && (
        <div style={{
          position:      'absolute',
          left:          '100%',
          top:           '50%',
          transform:     'translateY(-50%)',
          marginLeft:    '8px',
          padding:       '4px 10px',
          background:    colours.panelBgSolid,
          border:        `1px solid ${colours.borderHairline}`,
          borderRadius:  radius.xs,
          fontSize:      fontSize.xs,
          color:         colours.textPrimary,
          fontFamily:    fonts.sans,
          whiteSpace:    'nowrap' as const,
          zIndex:        100,
          boxShadow:     '0 4px 12px rgba(0,0,0,0.40)',
          pointerEvents: 'none',
        }}>
          {item.label}
        </div>
      )}
    </div>
  )
}

// ─── NavGroupSection ─────────────────────────────────────────────────────────

function NavGroupSection({
  group,
  collapsed,
  activeId,
  pathname,
  onSelect,
}: {
  group:     ShellNavGroup
  collapsed: boolean
  activeId?: string
  pathname:  string
  onSelect?: (id: string) => void
}) {
  const colours               = useColours()
  const [open, setOpen]       = useState(group.defaultOpen !== false)
  const effectiveOpen         = collapsed ? true : open

  function isItemActive(item: ShellNavItem): boolean {
    if (item.href) {
      // Route-based active state — handle root route exactly to avoid false positives
      if (item.href === '/accountant' || item.href === '/admin') {
        return (
          pathname === item.href ||
          pathname.startsWith(item.href + '/clients') ||
          pathname.startsWith(item.href + '/c/')
        )
      }
      return pathname.startsWith(item.href)
    }
    return item.id === activeId
  }

  return (
    <div style={{ marginBottom: '4px' }}>
      {/* Group label — only shown when expanded */}
      {!collapsed && group.label && (
        group.collapsible ? (
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
              marginTop:      '6px',
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
        ) : (
          <div style={{ marginTop: '6px' }}>
            <div style={{ height: '1px', background: colours.borderHairline, margin: '0 4px 10px' }} />
            <div style={{
              fontSize:      fontSize.xs,
              color:         colours.navGroupLabel,
              fontFamily:    fonts.sans,
              fontWeight:    fontWeight.medium,
              letterSpacing: '0.01em',
              padding:       '0 10px 5px',
            }}>
              {group.label}
            </div>
          </div>
        )
      )}

      {effectiveOpen && group.items.map(item => (
        <NavItemRow
          key={item.id}
          item={item}
          isActive={isItemActive(item)}
          collapsed={collapsed}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// ─── BaseShell ───────────────────────────────────────────────────────────────

export default function BaseShell({
  topBarContent,
  footerIdentity,
  email,
  footerItems,
  navGroups,
  children,
  collapsible   = false,
  storageKey,
  showOrbs      = false,
  sidebarStyle  = 'floating',
  activeId,
  onNavSelect,
}: BaseShellProps) {
  const colours = useColours()
  const pathname = usePathname()

  const [collapsed,    setCollapsed]    = useState(false)
  const [popoverOpen,  setPopoverOpen]  = useState(false)

  // Hydrate collapse state from localStorage
  useEffect(() => {
    if (!collapsible || !storageKey) return
    try {
      if (localStorage.getItem(storageKey) === 'collapsed') setCollapsed(true)
    } catch { /* SSR / private browsing */ }
  }, [collapsible, storageKey])

  function toggleCollapse() {
    setCollapsed(prev => {
      const next = !prev
      if (storageKey) {
        try { localStorage.setItem(storageKey, next ? 'collapsed' : 'expanded') } catch {}
      }
      return next
    })
  }

  const isFloating = sidebarStyle === 'floating'
  const sidebarW   = collapsed ? COLLAPSED_W : EXPANDED_W
  const footerInset = isFloating ? spacing.sidebar.padding : '6px'

  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      background: colours.pageBg,
      fontFamily: fonts.sans,
      overflow:   'hidden',
    }}>
      <style>{keyframes}</style>

      {/* ── Background orbs (light portals only) ── */}
      {showOrbs && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', ...orbStyles.blueTopRight }} />
          <div style={{ position: 'absolute', ...orbStyles.skyBottomLeft }} />
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width:         sidebarW,
        flexShrink:    0,
        ...(isFloating ? {
          margin:       '12px 0 12px 12px',
          background:   colours.sidebarBg,
          borderRadius: radius.sidebar,
          boxShadow:    `0 0 0 1px ${colours.borderHairline}, 0 4px 24px ${colours.sidebarShadow}`,
        } : {
          background:   colours.sidebarBg,
          borderRight:  `1px solid ${colours.borderHairline}`,
        }),
        display:        'flex',
        flexDirection:  'column',
        zIndex:         10,
        overflow:       'visible',
        position:       'relative',
        transition:     collapsible ? transition.fast : undefined,
      }}>

        {/* ── Top bar: topBarContent + optional collapse toggle ── */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: collapsed ? 'center' : (collapsible ? 'space-between' : 'flex-start'),
          padding:        collapsed
            ? '16px 12px'
            : isFloating
              ? `${spacing.sidebar.userPadding} 18px 18px`
              : '16px 18px',
          ...(isFloating ? {} : { borderBottom: `1px solid ${colours.borderHairline}` }),
          minHeight:      '56px',
          flexShrink:     0,
        }}>
          {!collapsed && topBarContent}

          {collapsible && (
            <button
              onClick={toggleCollapse}
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
                marginTop:      isFloating ? '4px' : '0',
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
          )}
        </div>

        {/* Divider below top bar (floating only, not shown when collapsed) */}
        {isFloating && !collapsed && (
          <div style={{ height: '1px', background: colours.borderHairline, margin: '0 18px' }} />
        )}

        {/* ── Nav ── */}
        <nav style={{
          padding:   collapsed ? '8px 6px' : `${spacing.sidebar.padding} 10px`,
          flex:      1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {navGroups.map(group => (
            <NavGroupSection
              key={group.id}
              group={group}
              collapsed={collapsed}
              activeId={activeId}
              pathname={pathname}
              onSelect={onNavSelect}
            />
          ))}
        </nav>

        {/* Divider above footer */}
        <div style={{
          height:     '1px',
          background: colours.borderHairline,
          margin:     collapsed ? '0 6px' : '0 18px',
          flexShrink: 0,
        }} />

        {/* ── Footer: user card + popover ── */}
        <div style={{ padding: collapsed ? '6px' : '10px', position: 'relative', flexShrink: 0 }}>
          {popoverOpen && (
            <FooterPopover
              email={email}
              items={footerItems}
              onClose={() => setPopoverOpen(false)}
              inset={footerInset}
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
            {/* Avatar */}
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
              {footerIdentity.avatarLetter}
            </div>

            {/* Name + subtitle + chevron */}
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
                    {footerIdentity.name}
                  </div>
                  <div style={{
                    fontSize:   fontSize.xs,
                    color:      colours.textMuted,
                    fontFamily: fonts.mono,
                  }}>
                    {footerIdentity.subtitle}
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

      {/* ── Main content area ── */}
      <main style={{
        flex:       1,
        overflowY:  'auto',
        padding:    isFloating ? '12px 12px 12px 10px' : '0',
        background: colours.pageBg,
        position:   'relative',
        zIndex:     1,
      }}>
        {children}
      </main>
    </div>
  )
}
