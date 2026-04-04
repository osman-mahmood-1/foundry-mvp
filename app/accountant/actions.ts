'use server'

/**
 * app/accountant/actions.ts
 *
 * Server actions for the accountant portal.
 * Uses the admin client (service_role) for mutations that require
 * access to tables without accountant-write RLS yet.
 *
 * SECURITY: Every action verifies the caller's identity via their JWT
 * and checks assignment before touching any client data.
 * The service_role key never reaches the browser.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient }      from '@/lib/supabase-server'
import { getAccountantId, getUserRole } from '@/lib/roles'
import { logAudit }          from '@/lib/audit'
import { sendDocumentReadyEmail } from '@/lib/resend'

// ─── markDocumentReviewed ─────────────────────────────────────────────────────

/**
 * Mark a document as reviewed by the current accountant.
 *
 * Verifies:
 *   1. User is authenticated
 *   2. User has accountant or platform_editor role
 *   3. Accountant is assigned to the client who owns the document
 *      (platform editors bypass this check)
 */
export async function markDocumentReviewed(
  documentId: string,
  clientId:   string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Not authenticated.' }

  const role         = getUserRole(user)
  const accountantId = getAccountantId(user)

  if (role !== 'accountant' && role !== 'platform_editor') {
    return { error: 'Not authorised.' }
  }

  const admin = createAdminClient()

  // Accountants must be assigned to this client
  if (role === 'accountant') {
    if (!accountantId) return { error: 'Not authorised.' }

    const { data: assignment } = await admin
      .from('accountant_clients')
      .select('id')
      .eq('accountant_id', accountantId)
      .eq('client_id', clientId)
      .limit(1)

    if (!assignment || assignment.length === 0) {
      return { error: 'Not authorised.' }
    }
  }

  // Update the document
  const { error: updateError } = await admin
    .from('documents')
    .update({
      reviewed:    true,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .eq('client_id', clientId)   // extra safety: ensure doc belongs to this client

  if (updateError) {
    console.error('DOC_ACT_001', updateError)
    return { error: 'Could not update document. Please try again.' }
  }

  // Audit
  void logAudit({
    actorId:    user.id,
    actorRole:  role === 'platform_editor' ? 'accountant' : 'accountant',
    clientId,
    action:     'document.reviewed',
    targetType: 'document',
    targetId:   documentId,
  })

  // Notify client their document has been reviewed — fire-and-forget
  try {
    const { data: docWithClient } = await admin
      .from('documents')
      .select('original_filename, clients(full_name, user_id)')
      .eq('id', documentId)
      .single()

    if (docWithClient) {
      const clientRecord = docWithClient.clients as unknown as { full_name: string | null; user_id: string } | null
      if (clientRecord?.user_id) {
        const { data: authUser } = await admin.auth.admin.getUserById(clientRecord.user_id)
        if (authUser?.user?.email) {
          void sendDocumentReadyEmail({
            to:           authUser.user.email,
            firstName:    clientRecord.full_name?.split(' ')[0] ?? 'there',
            documentName: (docWithClient.original_filename as string) ?? 'Your document',
          })
        }
      }
    }
  } catch (notifyErr) {
    // Notification failure must not affect the review action result
    console.error('DOC_NOTIFY_001', notifyErr)
  }

  return { error: null }
}
