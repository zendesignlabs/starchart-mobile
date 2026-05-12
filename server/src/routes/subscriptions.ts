import { Hono } from 'hono'
import { stripe, TRIAL_DAYS } from '../lib/stripe.js'

export const subscriptionRouter = new Hono()

// Create a checkout session with 7-day trial
// Body: { email: string, userId: string, priceId: string, successUrl: string, cancelUrl: string }
subscriptionRouter.post('/create-checkout', async (c) => {
  const body = await c.req.json<{
    email: string
    userId: string
    priceId: string
    successUrl: string
    cancelUrl: string
  }>()

  try {
    // Create or retrieve customer
    const existing = await stripe.customers.list({ email: body.email, limit: 1 })
    let customer: string

    if (existing.data.length > 0) {
      customer = existing.data[0].id
    } else {
      const created = await stripe.customers.create({
        email: body.email,
        metadata: { userId: body.userId },
      })
      customer = created.id
    }

    const session = await stripe.checkout.sessions.create({
      customer,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: body.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { userId: body.userId },
      },
      success_url: body.successUrl,
      cancel_url: body.cancelUrl,
    })

    return c.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Checkout session error:', err)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }
})

// Get subscription status for a customer by email
subscriptionRouter.get('/status', async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ error: 'email required' }, 400)

  try {
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) {
      return c.json({ status: 'none', trialing: false, active: false })
    }

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      limit: 1,
      status: 'all',
    })

    if (subs.data.length === 0) {
      return c.json({ status: 'none', trialing: false, active: false })
    }

    const sub = subs.data[0]
    return c.json({
      status: sub.status,
      trialing: sub.status === 'trialing',
      active: sub.status === 'active' || sub.status === 'trialing',
      trialEnd: sub.trial_end,
      billingCycleAnchor: sub.billing_cycle_anchor,
    })
  } catch (err) {
    console.error('Status check error:', err)
    return c.json({ error: 'Failed to check subscription status' }, 500)
  }
})
