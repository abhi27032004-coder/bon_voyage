import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const destination = await prisma.destination.findUnique({
      where: { id: params.id },
      include: {
        attractions: true,
      },
    })

    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    return NextResponse.json({ destination })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch destination details' }, { status: 500 })
  }
}
