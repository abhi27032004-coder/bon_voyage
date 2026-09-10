import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status })
  }

  try {
    const totalUsers = await prisma.user.count()
    const totalTrips = await prisma.trip.count()
    const activeTrips = await prisma.trip.count({ where: { status: 'ACTIVE' } })
    const completedTrips = await prisma.trip.count({ where: { status: 'COMPLETED' } })
    const upcomingTrips = await prisma.trip.count({ where: { status: 'UPCOMING' } })

    const totalDestinations = await prisma.destination.count()
    const popularDestinationsCount = await prisma.destination.count({ where: { popular: true } })

    const totalExpensesCount = await prisma.expense.count()
    const totalExpensesSumAggregate = await prisma.expense.aggregate({
      _sum: { amount: true },
    })

    const totalNotifications = await prisma.notification.count()

    const usersList = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { ownedTrips: true, tripMembers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const topDestinations = await prisma.destination.findMany({
      include: {
        _count: {
          select: { favourites: true, attractions: true },
        },
      },
      take: 10,
      orderBy: { popular: 'desc' },
    })

    return NextResponse.json({
      userAnalytics: {
        totalUsers,
      },
      tripAnalytics: {
        totalTrips,
        activeTrips,
        completedTrips,
        upcomingTrips,
      },
      destinationAnalytics: {
        totalDestinations,
        popularDestinationsCount,
        topDestinations,
      },
      platformStats: {
        totalExpenses: totalExpensesCount,
        totalExpenseVolume: Number(totalExpensesSumAggregate._sum.amount || 0),
        totalNotifications,
      },
      recentUsers: usersList,
    })
  } catch (error: any) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin metrics' }, { status: 500 })
  }
}
