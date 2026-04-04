/**
 * app/login/page.tsx
 *
 * Sign-in page shell.
 * All UI lives in LoginClient.tsx — this file only provides the
 * Next.js page export and the Suspense boundary required by useSearchParams.
 */

import { Suspense }     from 'react'
import LoginClient      from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
