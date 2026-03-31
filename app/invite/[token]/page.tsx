import { validateInviteToken } from '../actions'
import { createClient } from '@/lib/supabase-server'
import InviteClient from './InviteClient'

interface Props {
  params: Promise<{ token: string }>
}

/**
 * /invite/[token]
 *
 * Server component: validates the token and reads the current session.
 * Passes both down to InviteClient which handles all interactive states:
 *   - Token invalid/expired/used → error screen
 *   - Not signed in              → send magic link
 *   - Signed in, right email     → accept invite → provision role → redirect
 *   - Signed in, wrong email     → wrong account screen
 */
export default async function InvitePage({ params }: Props) {
  const { token } = await params

  const [validation, supabase] = await Promise.all([
    validateInviteToken(token),
    createClient(),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <InviteClient
      token={token}
      tokenData={validation.token ?? null}
      tokenError={validation.error ?? null}
      currentUserEmail={user?.email ?? null}
    />
  )
}
