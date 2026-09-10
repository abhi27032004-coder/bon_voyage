import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const popular = searchParams.get('popular')
  const q = searchParams.get('q')

  try {
    const destinations = await prisma.destination.findMany({
      where: {
        ...(popular === 'true' ? { popular: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { country: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        attractions: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ destinations })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const { name, country, description, image, location, popular } = body

    if (!name || !country || !description) {
      return NextResponse.json({ error: 'Name, country, and description are required' }, { status: 400 })
    }

    const destination = await prisma.destination.create({
      data: {
        name,
        country,
        description,
        image: image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        location: location || `${name}, ${country}`,
        popular: Boolean(popular),
      },
    })

    return NextResponse.json({ message: 'Destination created successfully', destination }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 })
  }
}
