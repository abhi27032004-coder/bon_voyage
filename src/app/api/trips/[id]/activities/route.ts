import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { itineraryDayId, name, description, location, startTime, endTime } = body

    if (!itineraryDayId || !name) {
      return NextResponse.json({ error: 'Itinerary day ID and activity name are required' }, { status: 400 })
    }

    const activity = await prisma.activity.create({
      data: {
        itineraryDayId,
        name,
        description: description || '',
        location: location || '',
        startTime: startTime || null,
        endTime: endTime || null,
      },
    })

    return NextResponse.json({ message: 'Activity created', activity }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { activityId, name, description, location, startTime, endTime } = body

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 })
    }

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
      },
    })

    return NextResponse.json({ message: 'Activity updated', activity: updated })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const activityId = searchParams.get('activityId')

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 })
    }

    await prisma.activity.delete({
      where: { id: activityId },
    })

    return NextResponse.json({ message: 'Activity deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
