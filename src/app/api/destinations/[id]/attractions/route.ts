import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const destinationId = params.id
    const body = await req.json()
    const { name, description, image, location } = body

    if (!name || !description) {
      return NextResponse.json({ error: 'Attraction name and description are required' }, { status: 400 })
    }

    const attraction = await prisma.attraction.create({
      data: {
        destinationId,
        name,
        description,
        image: image || null,
        location: location || null,
      },
    })

    return NextResponse.json({ message: 'Attraction created successfully', attraction }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create attraction' }, { status: 500 })
  }
}
