import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        itineraries: {
          include: {
            activities: true,
          },
          orderBy: { dayNumber: 'asc' },
        },
        budget: true,
        expenses: {
          include: {
            payer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { date: 'desc' },
        },
        joinRequests: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const isOwner = trip.ownerId === auth.user.id
    const isMember = trip.members.some((m) => m.userId === auth.user.id)

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied: You are not a member of this trip' }, { status: 403 })
    }

    return NextResponse.json({ trip })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch trip details' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const body = await req.json()
    const { name, destination, startDate, endDate, description, status } = body

    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
      },
    })

    if (!existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const memberRecord = existingTrip.members.find((m) => m.userId === auth.user.id)
    const isOwnerOrAdmin =
      existingTrip.ownerId === auth.user.id ||
      memberRecord?.role === 'TRIP_OWNER' ||
      memberRecord?.role === 'GROUP_ADMIN'

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only trip owner or admins can modify trip details' }, { status: 403 })
    }

    const updatedStartDate = startDate ? new Date(startDate) : existingTrip.startDate
    const updatedEndDate = endDate ? new Date(endDate) : existingTrip.endDate

    const destChanged = destination && destination !== existingTrip.destination
    const datesChanged =
      (startDate && updatedStartDate.getTime() !== existingTrip.startDate.getTime()) ||
      (endDate && updatedEndDate.getTime() !== existingTrip.endDate.getTime())

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(name ? { name } : {}),
        ...(destination ? { destination } : {}),
        ...(startDate ? { startDate: updatedStartDate } : {}),
        ...(endDate ? { endDate: updatedEndDate } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status } : {}),
      },
    })

    if (destChanged || datesChanged) {
      const message = `Travel details updated for "${updatedTrip.name}": ${
        destChanged ? `Destination changed to ${destination}. ` : ''
      }${datesChanged ? `Dates updated to ${updatedStartDate.toISOString().split('T')[0]} - ${updatedEndDate.toISOString().split('T')[0]}.` : ''}`

      const otherMembers = existingTrip.members.filter((m) => m.userId !== auth.user.id)
      for (const m of otherMembers) {
        await prisma.notification.create({
          data: {
            recipientId: m.userId,
            message,
            type: 'TRAVEL_UPDATE',
          },
        })
      }
    }

    return NextResponse.json({ message: 'Trip updated successfully', trip: updatedTrip })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
    })

    if (!existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (existingTrip.ownerId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only the trip owner can delete this trip' }, { status: 403 })
    }

    await prisma.trip.delete({
      where: { id: tripId },
    })

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}
