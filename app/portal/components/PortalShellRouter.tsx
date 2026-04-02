'use client'

/**
 * app/portal/components/PortalShellRouter.tsx
 *
 * Client component that switches between desktop (PortalShell) and
 * mobile (MobilePortalShell) at the 768px breakpoint.
 *
 * Lives between the server page.tsx and the two shells so neither
 * shell needs to be aware of the responsive switch.
 */

import type { Client } from '@/types'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import PortalShell       from './PortalShell'
import MobilePortalShell from './MobilePortalShell'

interface Props {
  client: Client
}

export default function PortalShellRouter({ client }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile
    ? <MobilePortalShell client={client} />
    : <PortalShell       client={client} />
}
