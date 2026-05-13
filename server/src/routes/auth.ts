import { Hono } from 'hono'
import { verifyAppleIdentityToken } from '../lib/apple.js'
import { signAppToken, verifyAppToken } from '../lib/jwt.js'

export const authRouter = new Hono()

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID ?? ''

// POST /api/auth/apple
// Body: { identityToken: string, email?: string }
// Verifies Apple's identity token and returns our app JWT.
// email is only sent by Apple on the first sign-in; subsequent calls omit it.
authRouter.post('/apple', async (c) => {
  const { identityToken, email } = await c.req.json<{
    identityToken: string
    email?: string
  }>()

  if (!identityToken) return c.json({ error: 'identityToken required' }, 400)
  if (!APPLE_CLIENT_ID) return c.json({ error: 'Apple Sign In not configured' }, 503)

  try {
    const claims = await verifyAppleIdentityToken(identityToken, APPLE_CLIENT_ID)
    const resolvedEmail = email ?? claims.email
    const token = await signAppToken({
      sub: `apple:${claims.sub}`,
      email: resolvedEmail,
      provider: 'apple',
    })
    return c.json({ token, email: resolvedEmail })
  } catch (err) {
    console.error('Apple Sign In verification failed:', err)
    return c.json({ error: 'Invalid identity token' }, 401)
  }
})

// POST /api/auth/email
// Body: { email: string }
// Issues an app JWT anchored to the email address.
// MVP: no password / OTP — the subscription gate is the real protection.
// The email must have an active Stripe subscription to access (app) routes.
authRouter.post('/email', async (c) => {
  const { email } = await c.req.json<{ email: string }>()
  if (!email || !email.includes('@')) return c.json({ error: 'Valid email required' }, 400)

  const token = await signAppToken({
    sub: `email:${email.toLowerCase()}`,
    email: email.toLowerCase(),
    provider: 'email',
  })
  return c.json({ token, email: email.toLowerCase() })
})

// GET /api/auth/me
// Validates the Bearer token and returns the payload.
authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verifyAppToken(authHeader.slice(7))
    return c.json(payload)
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})
