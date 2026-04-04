/**
 * app/api/stripe/checkout/route.ts
 *
 * Creates a Stripe Checkout session for the Foundation plan (£0).
 * Called from OnboardingClient when user clicks "Get started free".
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY           — Stripe secret key (sk_test_... or sk_live_...)
 *   NEXT_PUBLIC_STRIPE_PRICE_ID_FREE — Price ID for the £0 Foundation plan
 *
 * On success: redirects to /onboarding?step=details&session_id={id}
 * On cancel:  redirects back to /onboarding
 *
 * The webhook (app/api/stripe/webhook/route.ts) handles provisioning
 * the client record after payment confirmation.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const { priceId } = await req.json() as { priceId: string }
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
    }

    const origin = req.headers.get('origin') ?? 'https://taxfoundry.co.uk'

    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price:    priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
      success_url: `${origin}/onboarding?step=details&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/onboarding`,
      // Allow promotion codes (for future discount campaigns)
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })

  } catch (err) {
    console.error('STRIPE_CHECKOUT_001', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
