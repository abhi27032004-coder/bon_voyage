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
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true, joinRequests: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.ownerId === auth.user.id || trip.members.some((m) => m.userId === auth.user.id)) {
      return NextResponse.json({ error: 'You are already a member of this trip' }, { status: 400 })
    }

    const existingRequest = trip.joinRequests.find((r) => r.userId === auth.user.id)
    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json({ error: 'You already have a pending join request for this trip' }, { status: 409 })
    }

    const joinRequest = await prisma.joinRequest.create({
      data: {
        tripId,
        userId: auth.user.id,
        status: 'PENDING',
      },
    })

    const admins = trip.members.filter((m) => m.role === 'TRIP_OWNER' || m.role === 'GROUP_ADMIN')
    const adminUserIds = Array.from(new Set([trip.ownerId, ...admins.map((a) => a.userId)]))

    for (const recipientId of adminUserIds) {
      await prisma.notification.create({
        data: {
          recipientId,
          message: `📩 ${auth.user.name} has requested to join your trip "${trip.name}".`,
          type: 'JOIN_REQUEST',
        },
      })
    }

    return NextResponse.json({ message: 'Join request sent successfully', joinRequest }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to send join request' }, { status: 500 })
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
    const { requestId, status } = body

    if (!requestId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Request ID and valid status (APPROVED or REJECTED) required' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const isOwnerOrAdmin =
      trip.ownerId === auth.user.id ||
      trip.members.some((m) => m.userId === auth.user.id && (m.role === 'TRIP_OWNER' || m.role === 'GROUP_ADMIN'))

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only trip owner/admin can respond to join requests' }, { status: 403 })
    }

    const joinReq = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    })

    if (!joinReq) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    const updatedRequest = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
    })

    if (status === 'APPROVED') {
      await prisma.tripMember.upsert({
        where: {
          tripId_userId: {
            tripId,
            userId: joinReq.userId,
          },
        },
        update: { role: 'MEMBER' },
        create: {
          tripId,
          userId: joinReq.userId,
          role: 'MEMBER',
        },
      })

      await prisma.notification.create({
        data: {
          recipientId: joinReq.userId,
          message: `🎉 Your join request for "${trip.name}" has been APPROVED!`,
          type: 'REQUEST_APPROVED',
        },
      })
    } else {
      await prisma.notification.create({
        data: {
          recipientId: joinReq.userId,
          message: `❌ Your join request for "${trip.name}" was declined.`,
          type: 'REQUEST_REJECTED',
        },
      })
    }

    return NextResponse.json({ message: `Join request ${status.toLowerCase()} successfully`, joinRequest: updatedRequest })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update join request' }, { status: 500 })
  }
}
