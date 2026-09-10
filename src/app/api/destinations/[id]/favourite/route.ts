import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const destinationId = params.id
    const fav = await prisma.userFavouriteDestination.upsert({
      where: {
        userId_destinationId: {
          userId: auth.user.id,
          destinationId,
        },
      },
      update: {},
      create: {
        userId: auth.user.id,
        destinationId,
      },
    })

    return NextResponse.json({ message: 'Destination added to favourites', favourite: fav })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add favourite' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const destinationId = params.id
    await prisma.userFavouriteDestination.deleteMany({
      where: {
        userId: auth.user.id,
        destinationId,
      },
    })

    return NextResponse.json({ message: 'Destination removed from favourites' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to remove favourite' }, { status: 500 })
  }
}
