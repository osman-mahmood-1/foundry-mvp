'use client'

/**
 * app/portal/components/PortalShellRouter.tsx
 *
 * CSS-first responsive switch between desktop and mobile shells.
 * Both shells are rendered; the browser hides the inactive one before
 * the first frame — eliminating the JS-driven flash on mobile refresh.
 */

import type { Client } from '@/types'
import PortalShell       from './PortalShell'
import MobilePortalShell from './MobilePortalShell'

interface Props {
  client: Client
}

export default function PortalShellRouter({ client }: Props) {
  return (
    <>
      <div className="desktop-only">
        <PortalShell client={client} />
      </div>
      <div className="mobile-only">
        <MobilePortalShell client={client} />
      </div>
    </>
  )
}
