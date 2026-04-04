import { Suspense } from 'react'
import SignupClient from './SignupClient'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupClient />
    </Suspense>
  )
}
