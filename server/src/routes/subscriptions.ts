import { Hono } from 'hono'
import { stripe, TRIAL_DAYS, PRICE_ID } from '../lib/stripe.js'
import { verifyAppToken } from '../lib/jwt.js'

export const subscriptionRouter = new Hono()

// Extract and verify the Bearer token from Authorization header.
// Returns the email from the token payload, or null if missing/invalid.
async function emailFromAuth(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const payload = await verifyAppToken(authHeader.slice(7))
    return payload.email ?? null
  } catch {
    return null
  }
}

// POST /api/subscriptions/create-checkout
// Requires Bearer token. Creates a Stripe checkout session with 7-day trial.
subscriptionRouter.post('/create-checkout', async (c) => {
  const email = await emailFromAuth(c.req.header('Authorization'))
  if (!email) return c.json({ error: 'Unauthorized' }, 401)

  const { successUrl, cancelUrl } = await c.req.json<{
    successUrl: string
    cancelUrl: string
  }>()

  try {
    const existing = await stripe.customers.list({ email, limit: 1 })
    let customer: string

    if (existing.data.length > 0) {
      customer = existing.data[0].id
    } else {
      const created = await stripe.customers.create({ email })
      customer = created.id
    }

    const session = await stripe.checkout.sessions.create({
      customer,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_DAYS },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return c.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Checkout session error:', err)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }
})

// GET /api/subscriptions/status
// Requires Bearer token. Returns subscription status for the authenticated user.
subscriptionRouter.get('/status', async (c) => {
  const email = await emailFromAuth(c.req.header('Authorization'))
  if (!email) return c.json({ error: 'Unauthorized' }, 401)

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
    })
  } catch (err) {
    console.error('Status check error:', err)
    return c.json({ error: 'Failed to check subscription status' }, 500)
  }
})
