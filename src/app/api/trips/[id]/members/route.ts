import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { sendNotificationEmail } from '@/lib/services/email'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const body = await req.json()
    const { email, role } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const currentMember = trip.members.find((m) => m.userId === auth.user.id)
    const isOwnerOrAdmin =
      trip.ownerId === auth.user.id ||
      currentMember?.role === 'TRIP_OWNER' ||
      currentMember?.role === 'GROUP_ADMIN'

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Regular members cannot manage trip members' },
        { status: 403 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: `No registered user found with email "${cleanEmail}". They must create a VoyageCraft account first.` },
        { status: 404 }
      )
    }

    const existingMember = trip.members.find((m) => m.userId === targetUser.id)
    if (existingMember) {
      return NextResponse.json({ error: 'This user is already a member of this trip' }, { status: 409 })
    }

    const newRole = role || 'MEMBER'
    const newMember = await prisma.tripMember.create({
      data: {
        tripId,
        userId: targetUser.id,
        role: newRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await prisma.notification.create({
      data: {
        recipientId: targetUser.id,
        message: `✈️ You have been added as a ${newRole} to the trip "${trip.name}" (${trip.destination}).`,
        type: 'MEMBER_ADDED',
      },
    })

    await sendNotificationEmail({
      to: targetUser.email,
      subject: `You've been added to trip "${trip.name}" on VoyageCraft`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Trip Collaboration Invitation</h2>
          <p>Hello ${targetUser.name},</p>
          <p>You have been added to the trip <strong>${trip.name}</strong> bound for <strong>${trip.destination}</strong> as a <strong>${newRole}</strong>.</p>
          <p>Log in to your VoyageCraft dashboard to view the itinerary, budget, and activities!</p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'Member added successfully', member: newMember }, { status: 201 })
  } catch (error: any) {
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Failed to add trip member' }, { status: 500 })
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
    const { memberId, role } = body

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Member ID and role are required' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const currentMember = trip.members.find((m) => m.userId === auth.user.id)
    const isOwnerOrAdmin =
      trip.ownerId === auth.user.id ||
      currentMember?.role === 'TRIP_OWNER' ||
      currentMember?.role === 'GROUP_ADMIN'

    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only trip owner/admin can change member roles' }, { status: 403 })
    }

    const updatedMember = await prisma.tripMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ message: 'Member role updated', member: updatedMember })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const tripId = params.id
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const currentMember = trip.members.find((m) => m.userId === auth.user.id)
    const targetMember = trip.members.find((m) => m.id === memberId)

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const isSelf = targetMember.userId === auth.user.id
    const isOwnerOrAdmin =
      trip.ownerId === auth.user.id ||
      currentMember?.role === 'TRIP_OWNER' ||
      currentMember?.role === 'GROUP_ADMIN'

    if (!isSelf && !isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to remove this member' }, { status: 403 })
    }

    if (targetMember.userId === trip.ownerId) {
      return NextResponse.json({ error: 'The trip owner cannot be removed' }, { status: 400 })
    }

    await prisma.tripMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ message: 'Member removed from trip' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
