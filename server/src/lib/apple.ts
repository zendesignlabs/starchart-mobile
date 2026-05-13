import { createRemoteJWKSet, jwtVerify } from 'jose'

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys'
const APPLE_ISSUER = 'https://appleid.apple.com'

const appleJWKS = createRemoteJWKSet(new URL(APPLE_JWKS_URL))

export interface AppleTokenClaims {
  sub: string       // Apple user ID (stable, opaque)
  email?: string    // Present on first sign-in; may be absent or relay address on subsequent
  email_verified?: boolean | string
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  clientId: string
): Promise<AppleTokenClaims> {
  const { payload } = await jwtVerify(identityToken, appleJWKS, {
    issuer: APPLE_ISSUER,
    audience: clientId,
  })
  return payload as unknown as AppleTokenClaims
}
