import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = '@starchart/auth_token'
const EMAIL_KEY = '@starchart/auth_email'

interface AuthState {
  token: string | null
  email: string | null
  hydrated: boolean
  setAuth: (token: string, email: string | undefined) => Promise<void>
  clearAuth: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  email: null,
  hydrated: false,

  setAuth: async (token, email) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    if (email) await SecureStore.setItemAsync(EMAIL_KEY, email)
    set({ token, email: email ?? null })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(EMAIL_KEY)
    set({ token: null, email: null })
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    const email = await SecureStore.getItemAsync(EMAIL_KEY)
    set({ token, email, hydrated: true })
  },
}))
