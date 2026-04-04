/**
 * app/api/stripe/webhook/route.ts
 *
 * Stripe webhook handler.
 * Verifies signature, processes events, provisions client records in Supabase.
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY      — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET  — Webhook signing secret (whsec_...)
 *                            From Stripe Dashboard → Developers → Webhooks
 *
 * Events handled:
 *   checkout.session.completed   — Creates/updates client record, sets tier + stripe IDs
 *   customer.subscription.updated — Updates tier if user upgrades/downgrades
 *   customer.subscription.deleted — Marks subscription as cancelled
 *
 * Idempotent: uses stripe_subscription_id as upsert key — safe to replay.
 *
 * To test locally:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@supabase/supabase-js'

// Admin client — bypasses RLS for provisioning
function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// Map Stripe price IDs to Foundry tier names
// Add your price IDs here as you create them in Stripe
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE       ?? '']: 'foundation',
  [process.env.STRIPE_PRICE_ID_MOMENTUM               ?? '']: 'momentum',
  [process.env.STRIPE_PRICE_ID_ACCELERATE             ?? '']: 'accelerate',
  [process.env.STRIPE_PRICE_ID_COMMAND                ?? '']: 'command',
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' })

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('STRIPE_WEBHOOK_SIG_001', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = adminClient()

  try {
    switch (event.type) {

      // ── Checkout completed ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session    = event.data.object as Stripe.Checkout.Session
        const userId     = session.metadata?.supabase_user_id
        const customerId = session.customer as string
        const subId      = session.subscription as string

        if (!userId) {
          console.error('STRIPE_WEBHOOK_002: no supabase_user_id in metadata')
          break
        }

        // Retrieve subscription to get price + period details
        const sub = await stripe.subscriptions.retrieve(subId)
        const priceId = sub.items.data[0]?.price.id ?? ''
        const tier    = PRICE_TO_TIER[priceId] ?? 'foundation'

        // Upsert client record — idempotent
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .limit(1)
          .single()

        if (existing) {
          await supabase
            .from('clients')
            .update({
              tier,
              stripe_customer_id:     customerId,
              stripe_subscription_id: subId,
              subscription_status:    'active',
            })
            .eq('id', existing.id)
        } else {
          // Client record not yet created (edge case — onboarding incomplete)
          await supabase.from('clients').insert({
            user_id:                userId,
            tier,
            stripe_customer_id:     customerId,
            stripe_subscription_id: subId,
            subscription_status:    'active',
            onboarding_complete:    false,
            tax_year:               '2024-25',
          })
        }

        console.log(`STRIPE_WEBHOOK: provisioned ${tier} for user ${userId}`)
        break
      }

      // ── Subscription updated (upgrade/downgrade) ───────────────────
      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id ?? ''
        const tier    = PRICE_TO_TIER[priceId] ?? 'foundation'

        await supabase
          .from('clients')
          .update({ tier, subscription_status: sub.status })
          .eq('stripe_subscription_id', sub.id)

        break
      }

      // ── Subscription cancelled ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await supabase
          .from('clients')
          .update({
            tier:                'foundation',
            subscription_status: 'cancelled',
          })
          .eq('stripe_subscription_id', sub.id)

        break
      }

      default:
        // Unhandled event — acknowledge and move on
        break
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('STRIPE_WEBHOOK_003', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}

