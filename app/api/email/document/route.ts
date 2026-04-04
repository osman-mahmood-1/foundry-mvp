import { NextResponse, type NextRequest } from 'next/server'
import { createClient }      from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendDocumentReadyEmail } from '@/lib/resend'

/**
 * POST /api/email/document
 *
 * Triggered by useDocuments after a client successfully uploads a document.
 * Notifies the assigned accountant that a document is ready for review.
 *
 * Body: { clientId: string, documentName: string }
 *
 * Security:
 *   - Caller must have an authenticated session.
 *   - clientId must match the caller's own client record.
 *   - Accountant email is sourced from the database — never from client input.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { clientId, documentName } = await request.json()
    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify caller owns this client record
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

    await sendDocumentReadyEmail({
      to:           accountant.email,
      firstName:    accountant.full_name?.split(' ')[0] ?? 'there',
      documentName: typeof documentName === 'string' ? documentName : 'New document',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('EMAIL_DOC_001', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
