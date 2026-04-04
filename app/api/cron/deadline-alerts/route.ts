import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendDeadlineAlertEmail } from '@/lib/resend'

/**
 * GET /api/cron/deadline-alerts
 *
 * Vercel cron job — runs daily at 08:00 UTC (see vercel.json).
 * Scans all upcoming deadlines and sends alerts at 30-day and 7-day thresholds.
 *
 * Security:
 *   - Protected by CRON_SECRET — Vercel injects this automatically on Pro plans.
 *   - Rejects all requests without the correct Bearer token.
 *   - Uses admin client only — no user session involved.
 *
 * Idempotency:
 *   - deadlines.notified_at is updated after each send.
 *   - A deadline is skipped if notified_at is within the last 24 hours.
 *   - Safe to run more than once per day.
 *
 * Schema (actual):
 *   deadlines: id, client_id, label, deadline_date, status, notified_at
 *   clients:   id, full_name, user_id
 */

const ALERT_DAYS = [30, 7] as const

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now   = new Date()
  let sent    = 0
  let skipped = 0

  try {
    const { data: deadlines, error } = await admin
      .from('deadlines')
      .select(`
        id,
        client_id,
        label,
        deadline_date,
        notified_at,
        clients ( id, full_name, user_id )
      `)
      .eq('status', 'upcoming')
      .gte('deadline_date', now.toISOString().split('T')[0])

    if (error) {
      console.error('CRON_DEADLINE_001', error)
      return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
    }

    for (const deadline of deadlines ?? []) {
      const deadlineDate  = new Date(deadline.deadline_date)
      const daysRemaining = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (!ALERT_DAYS.includes(daysRemaining as typeof ALERT_DAYS[number])) {
        skipped++
        continue
      }

      if (deadline.notified_at) {
        const hoursSince = (now.getTime() - new Date(deadline.notified_at).getTime()) / (1000 * 60 * 60)
        if (hoursSince < 24) { skipped++; continue }
      }

      const client = deadline.clients as unknown as { id: string; full_name: string | null; user_id: string } | null
      if (!client?.user_id) { skipped++; continue }

      const { data: authData } = await admin.auth.admin.getUserById(client.user_id)
      const email = authData?.user?.email
      if (!email) { skipped++; continue }

      try {
        await sendDeadlineAlertEmail({
          to:            email,
          firstName:     client.full_name?.split(' ')[0] ?? 'there',
          deadlineLabel: deadline.label,
          deadlineDate:  deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          daysRemaining,
        })

        await admin
          .from('deadlines')
          .update({ notified_at: now.toISOString() })
          .eq('id', deadline.id)

        sent++
      } catch (emailErr) {
        console.error('CRON_DEADLINE_002', deadline.id, emailErr)
        skipped++
      }
    }

    console.info(`CRON_DEADLINE: sent=${sent} skipped=${skipped}`)
    return NextResponse.json({ success: true, sent, skipped })

  } catch (err) {
    console.error('CRON_DEADLINE_003', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
