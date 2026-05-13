import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)

export interface AppTokenPayload {
  sub: string       // provider:providerId  e.g. "apple:001234.abcd" or "email:user@example.com"
  email?: string
  provider: 'apple' | 'email'
}

export async function signAppToken(payload: AppTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(secret)
}

export async function verifyAppToken(token: string): Promise<AppTokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as AppTokenPayload
}
