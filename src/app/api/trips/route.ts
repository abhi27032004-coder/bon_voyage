import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: auth.user.id },
          { members: { some: { userId: auth.user.id } } },
        ],
        ...(status ? { status: status as any } : {}),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        budget: true,
        expenses: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ trips })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { name, destination, startDate, endDate, description, initialBudget, currency } = body

    if (!name || !destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Trip name, destination, start date, and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date' }, { status: 400 })
    }

    const now = new Date()
    let status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' = 'UPCOMING'
    if (now >= start && now <= end) {
      status = 'ACTIVE'
    } else if (now > end) {
      status = 'COMPLETED'
    }

    const newTrip = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          name,
          destination,
          startDate: start,
          endDate: end,
          description: description || '',
          ownerId: auth.user.id,
          status,
          members: {
            create: {
              userId: auth.user.id,
              role: 'TRIP_OWNER',
            },
          },
        },
      })

      await tx.itineraryDay.create({
        data: {
          tripId: trip.id,
          dayNumber: 1,
          date: start,
          title: `Arrival in ${destination}`,
          description: 'Check-in, settle down, and explore surroundings.',
        },
      })

      if (initialBudget && Number(initialBudget) > 0) {
        await tx.budget.create({
          data: {
            tripId: trip.id,
            totalAmount: Number(initialBudget),
            currency: currency || 'USD',
          },
        })
      }

      return trip
    })

    return NextResponse.json({ message: 'Trip created successfully', trip: newTrip }, { status: 201 })
  } catch (error: any) {
    console.error('Create trip error:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}
