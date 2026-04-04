'use client'

/**
 * app/portal/components/PortalShellRouter.tsx
 *
 * CSS-first responsive switch between desktop and mobile shells.
 * Both shells are rendered; the browser hides the inactive one before
 * the first frame — eliminating the JS-driven flash on mobile refresh.
 *
 * Theme:
 *   Single PortalThemeProvider with no forceMode and the original
 *   storageKey 'foundry-theme'. This keeps ThemeContext.getInitialTheme()
 *   and PortalThemeProvider reading/writing the same key — they stay
 *   in sync. Desktop shell is always visually light because it is only
 *   visible at >768px where users expect light mode; mobile users can
 *   switch freely via Settings.
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
    <PortalThemeProvider defaultMode="light">
      <div className="desktop-only">
        <PortalShell client={client} />
      </div>
      <div className="mobile-only">
        <MobilePortalShell client={client} />
      </div>
    </PortalThemeProvider>
  )
}
