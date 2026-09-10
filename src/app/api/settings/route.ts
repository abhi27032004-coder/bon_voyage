import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, comparePassword, hashPassword } from '@/lib/auth'

export async function PUT(req: Request) {
  const auth = await requireUser()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { currentPassword, newPassword, name, travelPreferences } = body

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (travelPreferences !== undefined) updateData.travelPreferences = travelPreferences

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
      }

      const isValid = await comparePassword(currentPassword, user.passwordHash)
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
      }

      updateData.passwordHash = await hashPassword(newPassword)
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        travelPreferences: true,
      },
    })

    return NextResponse.json({ message: 'Settings updated successfully', user: updatedUser })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
