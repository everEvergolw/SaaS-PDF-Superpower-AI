import { db } from '@/db';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { NextResponse } from 'next/server'
import { headers } from 'next/headers';

export async function POST(request: Request) { 
 
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { message: 'Invalid signature', ok: false },
        { status: 500 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    const session = event.data
    .object as Stripe.Checkout.Session

  if (!session?.metadata?.userId) {
    return new Response(null, {
      status: 200,
    })
  }


    if (event.type === 'checkout.session.completed') {
      const subscription =
        await stripe.subscriptions.retrieve(
          session.subscription as string
        )
  
      await db.user.update({
        where: {
          id: session.metadata.userId,
        },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      })
    }
  
    if (event.type === 'invoice.payment_succeeded') {
      // Retrieve the subscription details from Stripe.
      const subscription =
        await stripe.subscriptions.retrieve(
          session.subscription as string
        )
  
      await db.user.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      })
    }

    return NextResponse.json({ result: event, ok: true })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { message: 'Something went wrong', ok: false },
      { status: 500 }
    )
  }
}
