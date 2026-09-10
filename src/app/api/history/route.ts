import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  const userId = auth.user.id
  const now = new Date()

  try {
    const historyTrips = await prisma.trip.findMany({
      where: {
        AND: [
          {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
          {
            OR: [
              { status: 'COMPLETED' },
              { endDate: { lt: now } },
            ],
          },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        budget: true,
        expenses: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { endDate: 'desc' },
    })

    const totalSpentInHistory = historyTrips.reduce((acc, t) => {
      const tripSpent = t.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      return acc + tripSpent
    }, 0)

    const uniqueDestinations = Array.from(new Set(historyTrips.map((t) => t.destination)))

    return NextResponse.json({
      historyTrips,
      metrics: {
        totalCompletedTrips: historyTrips.length,
        totalSpentInHistory,
        uniqueDestinationsCount: uniqueDestinations.length,
        uniqueDestinations,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch travel history' }, { status: 500 })
  }
}
