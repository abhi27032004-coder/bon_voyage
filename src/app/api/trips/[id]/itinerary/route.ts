import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const body = await req.json()
    const { title, description, date, dayNumber } = body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true, itineraries: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const isMember = trip.members.some((m) => m.userId === auth.user.id)
    if (!isMember && trip.ownerId !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const nextDayNum = dayNumber || trip.itineraries.length + 1
    const dayDate = date ? new Date(date) : new Date(trip.startDate.getTime() + (nextDayNum - 1) * 86400000)

    const itineraryDay = await prisma.itineraryDay.create({
      data: {
        tripId,
        dayNumber: nextDayNum,
        date: dayDate,
        title: title || `Day ${nextDayNum}`,
        description: description || '',
      },
    })

    return NextResponse.json({ message: 'Itinerary day created', itineraryDay }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create itinerary day' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { itineraryDayId, title, description, date } = body

    if (!itineraryDayId) {
      return NextResponse.json({ error: 'Itinerary day ID required' }, { status: 400 })
    }

    const updated = await prisma.itineraryDay.update({
      where: { id: itineraryDayId },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(date ? { date: new Date(date) } : {}),
      },
    })

    return NextResponse.json({ message: 'Itinerary day updated', itineraryDay: updated })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update itinerary day' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const itineraryDayId = searchParams.get('itineraryDayId')

    if (!itineraryDayId) {
      return NextResponse.json({ error: 'Itinerary day ID required' }, { status: 400 })
    }

    await prisma.itineraryDay.delete({
      where: { id: itineraryDayId },
    })

    return NextResponse.json({ message: 'Itinerary day deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete itinerary day' }, { status: 500 })
  }
}
