'use client'

/**
 * app/portal/components/MobilePortalShell.tsx
 *
 * Root mobile shell. Manages:
 * - Active tab state
 * - Hamburger / profile sheet open state
 * - Offline sync toast (from useOfflineQueue)
 */

import { useState, useEffect }     from 'react'
import { createPortal }            from 'react-dom'
import type { Client, PortalTab }  from '@/types'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }                  from '@/styles/tokens'
import { useOfflineQueue }         from '@/hooks/useOfflineQueue'

import MobileHeader            from './mobile/MobileHeader'
import MobileHamburger         from './mobile/MobileHamburger'
import MobileProfileSheet      from './mobile/MobileProfileSheet'
import MobileIntelligenceStrip from './mobile/MobileIntelligenceStrip'

import MobileOverviewTab     from './mobile/tabs/MobileOverviewTab'
import MobileIncomeTab       from './mobile/tabs/MobileIncomeTab'
import MobileExpensesTab     from './mobile/tabs/MobileExpensesTab'
import MobileTransactionsTab from './mobile/tabs/MobileTransactionsTab'
import MobileInvoicesTab     from './mobile/tabs/MobileInvoicesTab'
import MobileDocumentsTab    from './mobile/tabs/MobileDocumentsTab'
import MobileMessagesTab     from './mobile/tabs/MobileMessagesTab'
import MobileSubmissionTab   from './mobile/tabs/MobileSubmissionTab'
import MobileIntelligenceTab from './mobile/tabs/MobileIntelligenceTab'

interface Props {
  client: Client
}

function TabContent({
  activeTab, client, onTabChange,
}: {
  activeTab: PortalTab
  client:    Client
  onTabChange: (tab: PortalTab) => void
}) {
  switch (activeTab) {
    case 'overview':     return <MobileOverviewTab     client={client} onTabChange={onTabChange} />
    case 'income':       return <MobileIncomeTab       client={client} />
    case 'expenses':     return <MobileExpensesTab     client={client} />
    case 'transactions': return <MobileTransactionsTab client={client} />
    case 'invoices':     return <MobileInvoicesTab     client={client} />
    case 'documents':    return <MobileDocumentsTab    client={client} />
    case 'messages':     return <MobileMessagesTab     client={client} />
    case 'submission':   return <MobileSubmissionTab   client={client} onTabChange={onTabChange} />
    case 'intelligence': return <MobileIntelligenceTab client={client} />
    default:             return <MobileOverviewTab     client={client} onTabChange={onTabChange} />
  }
}

export default function MobilePortalShell({ client }: Props) {
  const colours = useColours()
  const mode    = useThemeMode()
  const [activeTab,      setActiveTab]      = useState<PortalTab>('overview')
  const [hamburgerOpen,  setHamburgerOpen]  = useState(false)
  const [profileOpen,    setProfileOpen]    = useState(false)
  const [mounted,        setMounted]        = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { syncToast, dismissToast } = useOfflineQueue()

  const firstName = client.full_name?.split(' ')[0] ?? 'You'

  const showStrip = activeTab === 'overview' || activeTab === 'intelligence'

  return (
    <>
      {mounted && createPortal(
        <div style={{
          position:      'fixed',
          inset:         0,
          zIndex:        -1,
          pointerEvents: 'none',
          background:    mode === 'dark' ? '#000000' : '#fdf5ec',
        }} />,
        document.body
      )}
      <div style={{
      display:        'flex',
      flexDirection:  'column',
      height:         '100dvh',
      minHeight:      '100vh',
      background:     colours.pageBg,
      overflow:       'hidden',
    }}>
      {/* Header */}
      <MobileHeader
        onIntelligence={() => setActiveTab('intelligence')}
        onHamburger={() => setHamburgerOpen(true)}
      />

      {/* Intelligence / offline strip — overview + intelligence tabs only */}
      {showStrip && (
        <MobileIntelligenceStrip onNavigate={tab => setActiveTab(tab as PortalTab)} />
      )}

      {/* Tab content */}
      <div
        key={activeTab}
        className="mobile-scroll-area"
        style={{
          flex:      1,
          overflowY: 'auto',
          animation: 'fadeUp 0.25s ease',
        }}
      >
        <TabContent
          activeTab={activeTab}
          client={client}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Hamburger nav */}
      {hamburgerOpen && (
        <MobileHamburger
          activeTab={activeTab}
          onSelect={(tab) => setActiveTab(tab)}
          onSettings={() => setProfileOpen(true)}
          onClose={() => setHamburgerOpen(false)}
          clientName={firstName}
        />
      )}

      {/* Profile / settings sheet */}
      {profileOpen && (
        <MobileProfileSheet
          client={client}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* Offline sync toast */}
      {syncToast && (
        <div
          className="sync-toast"
          onClick={dismissToast}
          style={{
            background: colours.warningLight,
            color:      colours.warning,
            border:     `1px solid ${colours.warningDark}40`,
          }}
        >
          {syncToast}
        </div>
      )}
    </div>
    </>
  )
}
