'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  CloudSun,
  Wind,
  Droplets,
  Heart,
  PlusCircle,
  Sparkles,
  Shield,
} from 'lucide-react'
import { CardSkeleton } from '@/components/LoadingSkeleton'

interface Attraction {
  id: string
  name: string
  description: string
  image?: string
  location?: string
}

interface DestinationDetails {
  id: string
  name: string
  country: string
  description: string
  image: string
  location?: string
  popular: boolean
  attractions: Attraction[]
}

interface WeatherData {
  destination: string
  tempC: number
  tempF: number
  condition: string
  humidity: number
  windKmH: number
  icon: string
  forecast: Array<{
    day: string
    tempC: number
    condition: string
    icon: string
  }>
}

export default function DestinationDetailsPage() {
  const params = useParams()
  const id = params.id as string

  const [destination, setDestination] = useState<DestinationDetails | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN'>('USER')
  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(true)

  // Admin add attraction modal
  const [addAttractionModal, setAddAttractionModal] = useState(false)
  const [attrName, setAttrName] = useState('')
  const [attrDesc, setAttrDesc] = useState('')
  const [attrLoc, setAttrLoc] = useState('')

  const fetchDestinationAndWeather = async () => {
    try {
      const res = await fetch(`/api/destinations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDestination(data.destination)

        // Fetch live weather from server endpoint
        if (data.destination?.name) {
          const wRes = await fetch(`/api/weather?destination=${encodeURIComponent(data.destination.name)}`)
          if (wRes.ok) {
            const wData = await wRes.json()
            setWeather(wData.weather)
          }
        }
      }

      // Check auth role & favourite status
      const pRes = await fetch('/api/profile')
      if (pRes.ok) {
        const pData = await pRes.json()
        setUserRole(pData.profile?.role || 'USER')
        const favIds = new Set<string>(
          pData.profile?.favouriteDestinations?.map((f: any) => f.destinationId) || []
        )
        setIsFav(favIds.has(id))
      }
    } catch {
      console.error('Failed to load destination details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDestinationAndWeather()
  }, [id])

  const toggleFavourite = async () => {
    const nextState = !isFav
    setIsFav(nextState)
    try {
      await fetch(`/api/destinations/${id}/favourite`, {
        method: nextState ? 'POST' : 'DELETE',
      })
    } catch {
      setIsFav(!nextState)
    }
  }

  const handleAddAttraction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/destinations/${id}/attractions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: attrName, description: attrDesc, location: attrLoc }),
      })
      if (res.ok) {
        setAddAttractionModal(false)
        setAttrName('')
        setAttrDesc('')
        setAttrLoc('')
        fetchDestinationAndWeather()
      }
    } catch {}
  }

  if (loading) return <CardSkeleton />

  if (!destination) {
    return (
      <div className="py-12 text-center text-slate-500">
        Destination not found.{' '}
        <Link href="/destinations" className="text-brand-600 font-semibold underline">
          Back to list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-4">
      <Link
        href="/destinations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Destinations
      </Link>

      {/* Hero Banner */}
      <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl">
        <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        <button
          onClick={toggleFavourite}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/90 backdrop-blur-md text-slate-800 hover:text-rose-500 shadow-lg transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`} />
        </button>

        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest bg-brand-600/90 px-3 py-1 rounded-full backdrop-blur-sm">
            {destination.country}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{destination.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-brand-400" /> {destination.location || `${destination.name}, ${destination.country}`}
          </p>
        </div>
      </div>

      {/* Main Grid: Description & Weather / Attractions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About {destination.name}</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {destination.description}
            </p>
          </div>

          {/* Attractions */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Top Attractions</h2>
                <p className="text-xs text-slate-500">Must-visit places and iconic landmarks</p>
              </div>

              {userRole === 'ADMIN' && (
                <button
                  onClick={() => setAddAttractionModal(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" /> Add Attraction (Admin)
                </button>
              )}
            </div>

            {destination.attractions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No attractions listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destination.attractions.map((attr) => (
                  <div key={attr.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-900 text-base">{attr.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{attr.description}</p>
                    {attr.location && (
                      <span className="text-[11px] text-slate-400 block pt-1">📍 {attr.location}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Weather Card (Calling Server Endpoint /api/weather) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-brand-600 to-cyan-600 text-white p-6 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-6 h-6 text-amber-300" />
                <h3 className="font-extrabold text-lg">Live Weather</h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Real-Time
              </span>
            </div>

            {weather ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-5xl font-black">{weather.tempC}°C</span>
                    <span className="text-sm font-semibold text-brand-100 block">({weather.tempF}°F)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl">{weather.icon}</span>
                    <p className="text-xs font-semibold text-brand-100 pt-1">{weather.condition}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20 text-xs">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-200" />
                    <span>Humidity: {weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-cyan-200" />
                    <span>Wind: {weather.windKmH} km/h</span>
                  </div>
                </div>

                {weather.forecast && (
                  <div className="space-y-2 pt-2 border-t border-white/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-200">Forecast</h4>
                    <div className="space-y-1.5 text-xs">
                      {weather.forecast.map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/10 px-3 py-1.5 rounded-xl">
                          <span>{f.day}</span>
                          <span className="font-bold">{f.tempC}°C • {f.condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-100">Fetching live weather data...</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Add Attraction Modal */}
      {addAttractionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleAddAttraction} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Destination Attraction</h3>
            <input
              type="text"
              required
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="Attraction Name (e.g. Fushimi Inari Shrine)"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <input
              type="text"
              value={attrLoc}
              onChange={(e) => setAttrLoc(e.target.value)}
              placeholder="Location details"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <textarea
              rows={3}
              required
              value={attrDesc}
              onChange={(e) => setAttrDesc(e.target.value)}
              placeholder="Attraction description..."
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAddAttractionModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl">
                Create Attraction
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
