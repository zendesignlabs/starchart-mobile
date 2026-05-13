import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = '@starchart/auth_token'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://mobile.starchart.now'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithApple(identityToken: string, email?: string) {
  const res = await api.post<{ token: string; email?: string }>('/api/auth/apple', {
    identityToken,
    email,
  })
  return res.data
}

export async function signInWithEmail(email: string) {
  const res = await api.post<{ token: string; email: string }>('/api/auth/email', { email })
  return res.data
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface SubscriptionStatus {
  status: string
  trialing: boolean
  active: boolean
  trialEnd?: number | null
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await api.get<SubscriptionStatus>('/api/subscriptions/status')
  return res.data
}

export async function createCheckoutSession(successUrl: string, cancelUrl: string) {
  const res = await api.post<{ url: string; sessionId: string }>(
    '/api/subscriptions/create-checkout',
    { successUrl, cancelUrl }
  )
  return res.data
}
