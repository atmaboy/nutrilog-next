import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-change-in-production-32ch')

export async function hashPassword(pwd: string, salt = '') {
  return crypto.createHash('sha256').update(salt + pwd).digest('hex')
}

export async function signUserToken(p: { userId: string; username: string }) {
  return new SignJWT({ ...p, role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function signAdminToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('4h')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as { userId?: string; username?: string; role: string }
}

export function extractToken(authHeader: string | null): string | null {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}
