import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken, setSessionCookie } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, confirmPassword } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    // Check if this is the first user in the database, make them ADMIN
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'ADMIN' : 'USER'

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        role,
      },
    })

    // Auto-seed default destinations if none exist
    const destCount = await prisma.destination.count()
    if (destCount === 0) {
      const { DEFAULT_DESTINATIONS } = await import('@/lib/seedData')
      for (const destData of DEFAULT_DESTINATIONS) {
        await prisma.destination.create({
          data: {
            name: destData.name,
            country: destData.country,
            description: destData.description,
            image: destData.image,
            location: destData.location,
            popular: destData.popular,
            attractions: {
              create: destData.attractions,
            },
          },
        })
      }
    }

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    })

    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    })

    setSessionCookie(response, token)
    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }
}
