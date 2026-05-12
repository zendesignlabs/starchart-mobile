import { Hono } from 'hono'

export const ephemerisRouter = new Hono()

const EPHEMERIS_URL = process.env.EPHEMERIS_URL ?? 'https://ephemeris.zendesignlabs.com'
const EPHEMERIS_KEY = process.env.EPHEMERIS_KEY ?? ''

async function proxyPost(path: string, body: unknown) {
  const res = await fetch(`${EPHEMERIS_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EPHEMERIS_KEY,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

ephemerisRouter.post('/chart', async (c) => {
  const body = await c.req.json()
  const data = await proxyPost('/chart', body)
  return c.json(data)
})

ephemerisRouter.post('/astrocartography', async (c) => {
  const body = await c.req.json()
  const data = await proxyPost('/astrocartography', body)
  return c.json(data)
})

ephemerisRouter.post('/transits-to-natal', async (c) => {
  const body = await c.req.json()
  const data = await proxyPost('/transits-to-natal', body)
  return c.json(data)
})

ephemerisRouter.post('/upcoming-markers', async (c) => {
  const body = await c.req.json()
  const data = await proxyPost('/upcoming-markers', body)
  return c.json(data)
})
