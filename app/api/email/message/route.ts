import { NextResponse, type NextRequest } from 'next/server'
import { createClient }      from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendMessageNotificationEmail } from '@/lib/resend'

/**
 * POST /api/email/message
 *
 * Triggered by useMessages after a client successfully inserts a message.
 * Notifies the assigned accountant that a new message is waiting.
 *
 * Body: { clientId: string, preview: string }
 *
 * Security:
 *   - Caller must have an authenticated session (verified via getUser).
 *   - clientId must match the caller's own client record to prevent
 *     one client triggering notifications for another.
 *   - Email is only sent to the accountant assigned to this client.
 *     No user-controlled email addresses are accepted as input.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { clientId, preview } = await request.json()
    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify the caller owns this client record
    const { data: client } = await admin
      .from('clients')
      .select('id, full_name, user_id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find the assigned accountant
    const { data: assignment } = await admin
      .from('accountant_clients')
      .select('accountant_id')
      .eq('client_id', clientId)
      .limit(1)
      .single()

    if (!assignment) {
      // No accountant assigned — nothing to notify, not an error
      return NextResponse.json({ success: true, skipped: 'no_accountant' })
    }

    const { data: accountant } = await admin
      .from('accountants')
      .select('email, full_name')
      .eq('id', assignment.accountant_id)
      .single()

    if (!accountant?.email) {
      return NextResponse.json({ success: true, skipped: 'no_accountant_email' })
    }

    await sendMessageNotificationEmail({
      to:        accountant.email,
      firstName: accountant.full_name?.split(' ')[0] ?? 'there',
      preview:   typeof preview === 'string' ? preview.slice(0, 200) : 'New message from client.',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('EMAIL_MSG_001', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
