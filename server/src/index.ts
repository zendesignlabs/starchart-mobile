import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { stripeRouter } from './routes/stripe.js'
import { ephemerisRouter } from './routes/ephemeris.js'
import { subscriptionRouter } from './routes/subscriptions.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: '*', // tighten in production
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}))

app.get('/health', (c) => c.json({ ok: true, service: 'starchart-mobile-api' }))

app.route('/api/webhooks', stripeRouter)
app.route('/api/subscriptions', subscriptionRouter)
app.route('/api/ephemeris', ephemerisRouter)

const port = parseInt(process.env.PORT ?? '3001')
serve({ fetch: app.fetch, port }, () => {
  console.log(`Starchart mobile API running on port ${port}`)
})
