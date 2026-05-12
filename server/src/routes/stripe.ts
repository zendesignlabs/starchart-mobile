import { Hono } from 'hono'
import Stripe from 'stripe'
import { stripe } from '../lib/stripe.js'

export const stripeRouter = new Hono()

// Raw body needed for webhook signature verification
stripeRouter.post('/stripe', async (c) => {
  const sig = c.req.header('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return c.json({ error: 'Missing signature or webhook secret' }, 400)
  }

  let event: Stripe.Event
  try {
    const rawBody = await c.req.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return c.json({ error: 'Invalid signature' }, 400)
  }

  console.log(`Stripe event: ${event.type}`)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`Subscription ${sub.id} status: ${sub.status} for customer ${sub.customer}`)
      // TODO: persist to DB when added
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`Subscription ${sub.id} cancelled for customer ${sub.customer}`)
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(`Payment succeeded for customer ${invoice.customer}`)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(`Payment failed for customer ${invoice.customer}`)
      break
    }
    case 'customer.subscription.trial_will_end': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`Trial ending soon for customer ${sub.customer}`)
      // TODO: send push notification
      break
    }
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return c.json({ received: true })
})
