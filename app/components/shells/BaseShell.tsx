'use client'

/**
 * app/components/shells/BaseShell.tsx
 *
 * Shared layout primitive for all Foundry portals.
 *
 * Structure (mirrors lotech-dashboard-v9.html):
 *
 *   [page bg]
 *   └─ ambient-orb (fixed, top-right, 900px, orange/gold, blur 65px)
 *   └─ app-shell  (flex row, full viewport)
 *      ├─ sidebar (transparent, floating nav)
 *      └─ right-area (flex col, overflow hidden)
 *         └─ inner-wrapper (flex: 1, padding 0 12px 12px 0)
 *            └─ inner-container (glass panel, border-radius 18px)
 *               └─ content (flex: 1, overflow-y auto)
 *                  └─ {children}
 *
 * Authority: lotech-dashboard-v9.html mockup — no other source.
 */

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { usePathname }   from 'next/navigation'
import Link              from 'next/link'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius }        from '@/styles/tokens/radius'
import { transition }    from '@/styles/tokens/motion'
import { spacing }       from '@/styles/tokens/spacing'
import { glass, orbs as orbStyles } from '@/styles/tokens/effects'

// ─── Public types ────────────────────────────────────────────────────────────

export interface ShellNavItem {
  id:          string
  label:       string
  icon:        string
  href?:       string
  comingSoon?: boolean
}

export interface ShellNavGroup {
  id:           string
  label:        string
  items:        ShellNavItem[]
  collapsible?: boolean
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
  topBarContent:      React.ReactNode
  footerIdentity:     { name: string; subtitle: string; avatarLetter: string }
  email:              string
  footerItems:        ShellFooterItem[]
  navGroups:          ShellNavGroup[]
  children:           React.ReactNode
  collapsible?:       boolean
  storageKey?:        string
  /** Show ambient orb (both themes use the orb; light mode reduces opacity) */
  showOrbs?:          boolean
  /** 'floating' = transparent sidebar with right-padding gap (default)
   *  'docked'   = transparent sidebar with border-right */
  sidebarStyle?:      'floating' | 'docked'
  activeId?:          string
  onNavSelect?:       (id: string) => void
  /** Initial placeholder for the topbar search input */
  searchPlaceholder?: string
}

// ─── ShellSearchContext ───────────────────────────────────────────────────────

interface ShellSearchCtx {
  query:          string
  setQuery:       (q: string) => void
  placeholder:    string
  setPlaceholder: (p: string) => void
}

const ShellSearchContext = createContext<ShellSearchCtx>({
  query: '', setQuery: () => {}, placeholder: '', setPlaceholder: () => {},
})

export function useShellSearch(): ShellSearchCtx {
  return useContext(ShellSearchContext)
}

const EXPANDED_W  = '200px'
const COLLAPSED_W = '52px'

// ─── FooterPopover ───────────────────────────────────────────────────────────

function FooterPopover({
  email,
  items,
  onClose,
}: {
  email:   string
  items:   ShellFooterItem[]
  onClose: () => void
}) {
  const colours = useColours()
  const mode    = useThemeMode()
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
        left:         '0',
        right:        '0',
        marginBottom: '8px',
        background:   colours.panelBgSolid,
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.container,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.28)',
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
        fontFamily:   fonts.sans,
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
                borderRadius: radius.md,
                fontSize:     fontSize.base,
                color:        item.danger ? colours.danger : colours.textSecondary,
                cursor:       'pointer',
                fontFamily:   fonts.sans,
                textAlign:    'left' as const,
                transition:   transition.snap,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = item.danger
                  ? colours.dangerLight
                  : colours.hoverBg
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '13px', opacity: 0.7 }}>{item.icon}</span>
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
  const colours               = useColours()
  const [hovered, setHovered] = useState(false)
  const hoverRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tooltip, setTooltip] = useState(false)
  const isSoon                = item.comingSoon === true

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
    gap:            collapsed ? '0' : '10px',
    padding:        collapsed ? '9px' : '9px 14px 9px 16px',
    borderRadius:   radius.md,   // 10px — matches mockup nav-item border-radius
    position:       'relative',
    // Active: gold-to-orange gradient bg with glow shadow
    background:     isActive
      ? colours.navActiveBg
      : (hovered && !isSoon ? colours.hoverBg : 'transparent'),
    boxShadow:      isActive ? colours.navActiveShadow : 'none',
    // Text color: active = black (dark theme) or white (light theme) per mockup
    color:          isSoon
      ? colours.textMuted
      : isActive
        ? colours.navActive
        : colours.navInactive,
    fontSize:       fontSize.base,
    fontWeight:     isActive ? fontWeight.bold : fontWeight.regular,
    marginBottom:   '2px',
    transition:     transition.snap,
    textDecoration: 'none',
    fontFamily:     fonts.sans,
    opacity:        isSoon ? 0.45 : 1,
    cursor:         isSoon ? 'default' : 'pointer',
    width:          '100%',
    textAlign:      'left' as const,
    border:         'none',
    boxSizing:      'border-box' as const,
    zIndex:         0,
  }

  const inner = (
    <>
      <span style={{
        fontSize:   '11px',
        opacity:    isActive ? 1 : 0.55,
        width:      collapsed ? 'auto' : '15px',
        textAlign:  'center' as const,
        flexShrink: 0,
      }}>
        {item.icon}
      </span>
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && isSoon && (
        <span style={{
          fontSize:      '8px',
          fontFamily:    fonts.sans,
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

      {/* Collapsed tooltip */}
      {collapsed && tooltip && (
        <div style={{
          position:      'absolute',
          left:          '100%',
          top:           '50%',
          transform:     'translateY(-50%)',
          marginLeft:    '8px',
          padding:       '5px 11px',
          background:    colours.panelBgSolid,
          backdropFilter:'blur(20px)',
          border:        `1px solid ${colours.borderHairline}`,
          borderRadius:  radius.md,
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
  const colours         = useColours()
  const [open, setOpen] = useState(group.defaultOpen !== false)
  const effectiveOpen   = collapsed ? true : open

  function isItemActive(item: ShellNavItem): boolean {
    if (item.href) {
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
    <div style={{ marginBottom: '2px' }}>
      {/* Group label */}
      {!collapsed && group.label && (
        group.collapsible ? (
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '6px 16px',
              background:     'transparent',
              border:         'none',
              cursor:         'pointer',
              fontSize:       fontSize.label,
              fontFamily:     fonts.sans,
              letterSpacing:  letterSpacing.label,
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
          <div style={{ marginTop: '14px' }}>
            <div style={{
              fontSize:      fontSize.label,
              color:         colours.navGroupLabel,
              fontFamily:    fonts.sans,
              fontWeight:    fontWeight.medium,
              letterSpacing: letterSpacing.label,
              padding:       '0 16px 4px',
              textTransform: 'uppercase' as const,
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
  collapsible       = false,
  storageKey,
  showOrbs          = false,
  sidebarStyle      = 'floating',
  activeId,
  onNavSelect,
  searchPlaceholder = '',
}: BaseShellProps) {
  const colours  = useColours()
  const mode     = useThemeMode()
  const pathname = usePathname()

  const [collapsed,         setCollapsed]         = useState(false)
  const [popoverOpen,       setPopoverOpen]        = useState(false)
  const [searchQuery,       setSearchQuery]        = useState('')
  const [searchExpanded,    setSearchExpanded]     = useState(false)
  const [searchPlaceholderState, setSearchPlaceholderState] = useState(searchPlaceholder)

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

  const sidebarW    = collapsed ? COLLAPSED_W : EXPANDED_W
  const isFloating  = sidebarStyle === 'floating'
  const glassStyles = glass.panel(mode)

  return (
    <ShellSearchContext.Provider value={{
      query:          searchQuery,
      setQuery:       setSearchQuery,
      placeholder:    searchPlaceholderState,
      setPlaceholder: setSearchPlaceholderState,
    }}>
    <div style={{
      display:    'flex',
      height:     '100vh',
      background: colours.pageBg,
      fontFamily: fonts.sans,
      overflow:   'hidden',
      position:   'relative',
    }}>

      {/* ── Ambient orb — fixed top-right, always rendered when showOrbs ── */}
      {showOrbs && (
        <div style={{
          ...orbStyles.ambient,
          opacity: mode === 'dark'
            ? orbStyles.ambientOpacityDark
            : orbStyles.ambientOpacityLight,
        }} />
      )}

      {/* ── Sidebar — transparent, sits directly on page bg ── */}
      <aside style={{
        width:          sidebarW,
        flexShrink:     0,
        background:     'transparent',
        // docked style gets a subtle right border; floating has no border
        borderRight:    isFloating ? 'none' : `1px solid ${colours.borderHairline}`,
        display:        'flex',
        flexDirection:  'column',
        // The right padding creates the visual gap between nav items and inner container
        padding:        collapsed
          ? `22px 0 18px 8px`
          : `22px 10px 18px 8px`,
        zIndex:         3,
        position:       'relative',
        transition:     collapsible ? transition.fast : undefined,
      }}>

        {/* ── Brand / top bar content + optional collapse toggle ── */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: collapsed ? 'center' : (collapsible ? 'space-between' : 'flex-start'),
          padding:        collapsed ? '0 6px 26px' : '0 6px 26px 16px',
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
                background:     colours.topbarItemBg,
                backdropFilter: 'blur(20px)',
                border:         `1px solid ${colours.topbarItemBorder}`,
                borderRadius:   radius.md,
                color:          colours.textMuted,
                cursor:         'pointer',
                fontSize:       '11px',
                transition:     transition.snap,
                flexShrink:     0,
                marginTop:      collapsed ? '0' : '4px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background   = colours.accentLight
                e.currentTarget.style.borderColor  = colours.accentBorder
                e.currentTarget.style.color        = colours.accent
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background   = colours.topbarItemBg
                e.currentTarget.style.borderColor  = colours.topbarItemBorder
                e.currentTarget.style.color        = colours.textMuted
              }}
            >
              {collapsed ? '⟩' : '⟨'}
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav style={{
          padding:   collapsed ? '0 6px' : '0 0 0 0',
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

        {/* ── Footer: user card + popover ── */}
        <div style={{
          padding:    collapsed ? '6px' : '10px 10px 0 0',
          position:   'relative',
          flexShrink: 0,
        }}>
          {popoverOpen && (
            <FooterPopover
              email={email}
              items={footerItems}
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
              padding:        collapsed ? '8px' : '8px 10px 8px 16px',
              background:     popoverOpen ? colours.hoverBg : 'transparent',
              border:         'none',
              borderRadius:   radius.md,
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
              background:     `linear-gradient(135deg, ${colours.accent}, ${colours.orange})`,
              boxShadow:      `0 4px 16px ${colours.accentLight}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       fontSize.xs,
              color:          colours.textInverse,
              fontWeight:     fontWeight.bold,
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
                    fontWeight:   fontWeight.semibold,
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
                    fontFamily: fonts.sans,
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

      {/* ── Right area: topbar → inner-wrapper → inner-container → content ── */}
      <div style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        position:      'relative',
        zIndex:        1,
      }}>

        {/* Inner wrapper — fills the full right area with gap on all sides */}
        <div style={{
          flex:       1,
          padding:    '12px 12px 12px 0',
          overflow:   'hidden',
          position:   'relative',
        }}>
          {/* Inner container — the main glass panel */}
          <div style={{
            width:          '100%',
            height:         '100%',
            ...glassStyles,
            display:        'flex',
            flexDirection:  'column',
            overflow:       'hidden',
            position:       'relative',
          }}>
          {/* ── Floating search — top-right inside glass panel ── */}
          <div style={{
            position:  'absolute',
            top:       '14px',
            right:     '14px',
            zIndex:    10,
            display:   'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}>
            <div style={{
              display:        'flex',
              alignItems:     'center',
              width:          searchExpanded ? '220px' : '32px',
              height:         '32px',
              borderRadius:   radius.pill,
              background:     searchExpanded ? colours.inputBg : 'transparent',
              border:         searchExpanded
                ? `1px solid ${colours.inputBorder}`
                : `1px solid transparent`,
              overflow:       'hidden',
              transition:     'width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s ease, border-color 0.2s ease',
              cursor:         searchExpanded ? 'text' : 'pointer',
            }}
              onClick={() => !searchExpanded && setSearchExpanded(true)}
            >
              {/* Search icon — always visible, left-anchored when expanded */}
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (searchExpanded) {
                    setSearchExpanded(false)
                    setSearchQuery('')
                  } else {
                    setSearchExpanded(true)
                  }
                }}
                style={{
                  width:          '32px',
                  height:         '32px',
                  flexShrink:     0,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  background:     searchExpanded ? 'transparent' : colours.topbarItemBg,
                  border:         searchExpanded ? 'none' : `1px solid ${colours.topbarItemBorder}`,
                  borderRadius:   radius.pill,
                  color:          colours.textMuted,
                  cursor:         'pointer',
                  fontSize:       '13px',
                  transition:     'background 0.2s ease, border-color 0.2s ease',
                }}
                aria-label={searchExpanded ? 'Close search' : 'Open search'}
              >
                {searchExpanded ? '✕' : '⌕'}
              </button>

              {/* Input — only rendered when expanded */}
              {searchExpanded && (
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && (setSearchExpanded(false), setSearchQuery(''))}
                  placeholder={searchPlaceholderState || 'Search…'}
                  style={{
                    flex:       1,
                    background: 'transparent',
                    border:     'none',
                    outline:    'none',
                    fontSize:   fontSize.sm,
                    color:      colours.textPrimary,
                    fontFamily: fonts.sans,
                    padding:    '0 10px 0 0',
                  }}
                />
              )}
            </div>
          </div>

          {/* Scrollable content area */}
            <div style={{
              flex:          1,
              overflowY:     'auto',
              overflowX:     'hidden',
              display:       'flex',
              flexDirection: 'column',
            }}>
              {children}
            </div>
          </div>
        </div>
      </div>

    </div>
    </ShellSearchContext.Provider>
  )
}
