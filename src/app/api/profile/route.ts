import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  const profile = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      travelPreferences: true,
      createdAt: true,
      favouriteDestinations: {
        include: {
          destination: true,
        },
      },
      ownedTrips: {
        select: {
          id: true,
          name: true,
          destination: true,
          status: true,
        },
      },
    },
  })

  return NextResponse.json({ profile })
}

export async function PUT(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { name, travelPreferences, image } = body

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(travelPreferences !== undefined ? { travelPreferences } : {}),
        ...(image !== undefined ? { image } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        travelPreferences: true,
      },
    })

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
