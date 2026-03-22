// app/api/email/welcome/route.ts
// Called by the onboarding page after the client profile is saved.
// Server-side only — API key never exposed to the browser.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '../../../../lib/resend'
import { createClient } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { firstName, tradeLabel } = await request.json()

    await sendWelcomeEmail({
      to: user.email!,
      firstName: firstName ?? 'there',
      tradeLabel,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    // Don't fail the onboarding if email fails — just log it
    return NextResponse.json({ success: false, error: 'Email failed' }, { status: 500 })
  }
}
