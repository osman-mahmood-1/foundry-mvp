'use client'

/**
 * app/portal/components/PortalShellRouter.tsx
 *
 * CSS-first responsive switch between desktop and mobile shells.
 * Both shells are rendered; the browser hides the inactive one before
 * the first frame — eliminating the JS-driven flash on mobile refresh.
 *
 * Theme ownership:
 *   Desktop → PortalThemeProvider forceMode="light" (always light, no toggle)
 *   Mobile  → PortalThemeProvider (no forceMode — reads localStorage, user can switch)
 */

import type { Client } from '@/types'
import PortalThemeProvider from './PortalThemeProvider'
import PortalShell         from './PortalShell'
import MobilePortalShell   from './MobilePortalShell'

interface Props {
  client: Client
}

export default function PortalShellRouter({ client }: Props) {
  return (
    <>
      <div className="desktop-only">
        <PortalThemeProvider forceMode="light">
          <PortalShell client={client} />
        </PortalThemeProvider>
      </div>
      <div className="mobile-only">
        <PortalThemeProvider storageKey="foundry-theme-mobile" defaultMode="light">
          <MobilePortalShell client={client} />
        </PortalThemeProvider>
      </div>
    </>
  )
}
