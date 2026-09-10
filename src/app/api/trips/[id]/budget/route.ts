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
    const body = await req.json()
    const { totalAmount, currency } = body

    if (totalAmount === undefined || Number(totalAmount) < 0) {
      return NextResponse.json({ error: 'Budget amount must be a positive number' }, { status: 400 })
    }

    const budget = await prisma.budget.upsert({
      where: { tripId },
      update: {
        totalAmount: Number(totalAmount),
        currency: currency || 'USD',
      },
      create: {
        tripId,
        totalAmount: Number(totalAmount),
        currency: currency || 'USD',
      },
    })

    return NextResponse.json({ message: 'Budget saved successfully', budget })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
  }
}
