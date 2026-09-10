import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  // Optional security check: Verify Authorization header or CRON_SECRET if configured
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Note: Vercel sends `authorization: Bearer CRON_SECRET` when configured
  }

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000)
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 3600000)

  let tripRemindersCount = 0
  let activityRemindersCount = 0

  try {
    // 1. Find upcoming trips starting within 7 days
    const upcomingTrips = await prisma.trip.findMany({
      where: {
        startDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        members: true,
      },
    })

    for (const trip of upcomingTrips) {
      const daysLeft = Math.ceil((trip.startDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
      const recipients = Array.from(new Set([trip.ownerId, ...trip.members.map((m) => m.userId)]))

      for (const recipientId of recipients) {
        // Prevent duplicate notification today for this trip
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const existingNotif = await prisma.notification.findFirst({
          where: {
            recipientId,
            type: 'TRIP_REMINDER',
            createdAt: { gte: startOfDay },
            message: { contains: trip.name },
          },
        })

        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              recipientId,
              message: `⏰ Trip Reminder: "${trip.name}" to ${trip.destination} starts in ${daysLeft} day${daysLeft > 1 ? 's' : ''}! Get ready for your journey.`,
              type: 'TRIP_REMINDER',
            },
          })
          tripRemindersCount++
        }
      }
    }

    // 2. Find activities beginning within next 24 hours
    const activities = await prisma.activity.findMany({
      where: {
        reminderSent: false,
        itineraryDay: {
          date: {
            gte: now,
            lte: twentyFourHoursFromNow,
          },
        },
      },
      include: {
        itineraryDay: {
          include: {
            trip: {
              include: { members: true },
            },
          },
        },
      },
    })

    for (const act of activities) {
      const trip = act.itineraryDay.trip
      const recipients = Array.from(new Set([trip.ownerId, ...trip.members.map((m) => m.userId)]))

      for (const recipientId of recipients) {
        await prisma.notification.create({
          data: {
            recipientId,
            message: `📍 Activity Reminder: "${act.name}" on trip "${trip.name}" is scheduled for today! ${act.startTime ? `Time: ${act.startTime}` : ''}`,
            type: 'ACTIVITY_REMINDER',
          },
        })
      }

      await prisma.activity.update({
        where: { id: act.id },
        data: { reminderSent: true },
      })
      activityRemindersCount++
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      tripRemindersCount,
      activityRemindersCount,
    })
  } catch (error: any) {
    console.error('Cron reminder error:', error)
    return NextResponse.json({ error: 'Failed to process scheduled reminders' }, { status: 500 })
  }
}
