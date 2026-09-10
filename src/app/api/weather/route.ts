import { NextResponse } from 'next/server'
import { fetchLiveWeather } from '@/lib/services/weather'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const destination = searchParams.get('destination') || 'Tokyo'

  try {
    const weather = await fetchLiveWeather(destination)
    return NextResponse.json({ weather })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 })
  }
}
