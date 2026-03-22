import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '../../../../lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { firstName, tradeLabel, email } = await request.json()

    await sendWelcomeEmail({
      to: email,
      firstName: firstName ?? 'there',
      tradeLabel,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
