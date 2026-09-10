import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const unreadCount = await prisma.notification.count({
      where: { recipientId: auth.user.id, read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { recipientId: auth.user.id, read: false },
        data: { read: true },
      })
      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!existing || existing.recipientId !== auth.user.id) {
      return NextResponse.json({ error: 'Notification not found or forbidden' }, { status: 403 })
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    return NextResponse.json({ message: 'Notification marked as read', notification: updated })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
