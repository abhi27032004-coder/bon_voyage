import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './db'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'voyagecraft-default-secret-change-in-production'
const COOKIE_NAME = 'voyagecraft_session'

export interface JWTPayload {
  userId: string
  email: string
  role: 'USER' | 'ADMIN'
  name: string
}

export type AuthResult =
  | { error: string; status: number; session: null; user: null }
  | {
      error: null
      status: 200
      session: JWTPayload
      user: {
        id: string
        name: string
        email: string
        role: 'USER' | 'ADMIN'
        image: string | null
        travelPreferences: string | null
      }
    }

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function requireUser(): Promise<AuthResult> {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized', status: 401, session: null, user: null }
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, image: true, travelPreferences: true }
  })
  if (!user) {
    return { error: 'User no longer exists', status: 401, session: null, user: null }
  }
  return { session, user, error: null, status: 200 }
}

export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireUser()
  if (auth.error || !auth.user) return auth
  if (auth.user.role !== 'ADMIN') {
    return { error: 'Forbidden: Admin access required', status: 403, session: null, user: null }
  }
  return auth
}
