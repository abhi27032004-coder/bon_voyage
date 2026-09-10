import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  try {
    if (!q.trim()) {
      return NextResponse.json({ trips: [] })
    }

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { destination: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: { userId: true } },
        joinRequests: {
          where: { userId: auth.user.id },
          select: { status: true },
        },
      },
      take: 10,
    })

    const formattedTrips = trips.map((t) => ({
      id: t.id,
      name: t.name,
      destination: t.destination,
      startDate: t.startDate,
      endDate: t.endDate,
      owner: t.owner,
      isMember: t.members.some((m) => m.userId === auth.user.id) || t.ownerId === auth.user.id,
      requestStatus: t.joinRequests[0]?.status || null,
    }))

    return NextResponse.json({ trips: formattedTrips })
  } catch (error: any) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
