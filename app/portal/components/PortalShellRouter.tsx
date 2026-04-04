'use client'

/**
 * app/portal/components/PortalShellRouter.tsx
 *
 * CSS-first responsive switch between desktop and mobile shells.
 * Both shells are rendered; the browser hides the inactive one before
 * the first frame — eliminating the JS-driven flash on mobile refresh.
 *
 * Theme:
 *   A single PortalThemeProvider wraps both shells so only one provider
 *   writes to document. Desktop shell passes forceLight={true} so its
 *   UI renders in light mode without overriding the document attribute
 *   (which mobile reads). Mobile reads and writes localStorage freely.
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
    <PortalThemeProvider storageKey="foundry-theme-mobile" defaultMode="light">
      <div className="desktop-only">
        <PortalShell client={client} />
      </div>
      <div className="mobile-only">
        <MobilePortalShell client={client} />
      </div>
    </PortalThemeProvider>
  )
}
