import Stripe from 'stripe'

if (!process.env.STRIPE_RESTRICTED_KEY) throw new Error('STRIPE_RESTRICTED_KEY not set')

export const stripe = new Stripe(process.env.STRIPE_RESTRICTED_KEY, {
  apiVersion: '2026-04-22.dahlia',
})

export const TRIAL_DAYS = 7
export const PRICE_ID = process.env.STRIPE_PRICE_ID_MONTHLY ?? 'price_1TWOlAHNmXIZFDIzXGdnSihm'
