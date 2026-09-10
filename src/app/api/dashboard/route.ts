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
    // 1. Get user trips (where user is owner or member)
    const userTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        budget: true,
        expenses: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    // 2. Upcoming Trips (future or active, soonest first)
    const upcomingTrips = userTrips
      .filter((t) => new Date(t.endDate) >= now || t.status === 'UPCOMING' || t.status === 'ACTIVE')
      .slice(0, 5)

    // 3. Travel Statistics & Budget Overview
    let totalBudget = 0
    let totalSpent = 0
    const destinationsSet = new Set<string>()
    const expenseCategoryMap: Record<string, number> = {
      Transportation: 0,
      Hotel: 0,
      Food: 0,
      Shopping: 0,
      Entertainment: 0,
      Miscellaneous: 0,
    }

    userTrips.forEach((trip) => {
      if (trip.destination) {
        destinationsSet.add(trip.destination.trim().toLowerCase())
      }
      if (trip.budget?.totalAmount) {
        totalBudget += Number(trip.budget.totalAmount)
      }

      trip.expenses.forEach((expense) => {
        const amt = Number(expense.amount)
        totalSpent += amt
        if (expenseCategoryMap[expense.category] !== undefined) {
          expenseCategoryMap[expense.category] += amt
        } else {
          expenseCategoryMap.Miscellaneous += amt
        }
      })
    })

    // 4. Most Visited Destinations from trip history
    const destCountMap: Record<string, number> = {}
    userTrips.forEach((t) => {
      if (t.destination) {
        const name = t.destination.trim()
        destCountMap[name] = (destCountMap[name] || 0) + 1
      }
    })
    const mostVisitedDestinations = Object.entries(destCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 5. User Favourite Destinations from PostgreSQL
    const favourites = await prisma.userFavouriteDestination.findMany({
      where: { userId },
      include: {
        destination: true,
      },
    })

    // 6. Notifications count
    const unreadNotificationsCount = await prisma.notification.count({
      where: { recipientId: userId, read: false },
    })

    return NextResponse.json({
      upcomingTrips,
      budgetOverview: {
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
      },
      expenseSummary: Object.entries(expenseCategoryMap).map(([category, amount]) => ({
        category,
        amount,
      })),
      favouriteDestinations: favourites.map((f) => f.destination),
      mostVisitedDestinations,
      statistics: {
        totalTrips: userTrips.length,
        activeTrips: userTrips.filter((t) => t.status === 'ACTIVE').length,
        completedTrips: userTrips.filter((t) => t.status === 'COMPLETED').length,
        totalDestinationsVisited: destinationsSet.size,
        totalAmountSpent: totalSpent,
        unreadNotificationsCount,
      },
    })
  } catch (error: any) {
    console.error('Dashboard endpoint error:', error)
    return NextResponse.json({ error: 'Failed to aggregate dashboard metrics' }, { status: 500 })
  }
}
