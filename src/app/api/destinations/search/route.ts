import { NextResponse } from 'next/server'
import { searchPlacesServerSide } from '@/lib/services/places'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''

  try {
    const results = await searchPlacesServerSide(q)
    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
