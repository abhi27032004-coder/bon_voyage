'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Search, Heart, Sparkles, Star } from 'lucide-react'
import { CardSkeleton } from '@/components/LoadingSkeleton'

interface Destination {
  id: string
  name: string
  country: string
  description: string
  image: string
  location?: string
  popular: boolean
  attractions?: Array<{ name: string }>
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [popularFilter, setPopularFilter] = useState(false)
  const [favourites, setFavourites] = useState<Set<string>>(new Set())

  const fetchDestinations = async () => {
    try {
      let url = '/api/destinations'
      const params = new URLSearchParams()
      if (popularFilter) params.append('popular', 'true')
      if (query.trim()) params.append('q', query)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDestinations(data.destinations || [])
      }
    } catch {
      console.error('Failed to load destinations')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserFavourites = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        const favIds = new Set<string>(
          data.profile?.favouriteDestinations?.map((f: any) => f.destinationId) || []
        )
        setFavourites(favIds)
      }
    } catch {}
  }

  useEffect(() => {
    fetchDestinations()
    fetchUserFavourites()
  }, [popularFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDestinations()
  }

  const toggleFavourite = async (e: React.MouseEvent, destId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const isFav = favourites.has(destId)
    const newFavs = new Set(favourites)
    if (isFav) newFavs.delete(destId)
    else newFavs.add(destId)
    setFavourites(newFavs)

    try {
      await fetch(`/api/destinations/${destId}/favourite`, {
        method: isFav ? 'DELETE' : 'POST',
      })
    } catch {
      // Revert if error
      setFavourites(favourites)
    }
  }

  return (
    <div className="space-y-8 py-4">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Destination Discovery Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Explore the World</h1>
          <p className="text-sm text-slate-300">
            Search curated destinations, check live weather, discover local attractions, and save your favourite spots.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city, country, or keyword (e.g. Kyoto, France)..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 font-semibold text-sm rounded-2xl shadow-md transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setPopularFilter(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              !popularFilter ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Destinations
          </button>
          <button
            onClick={() => setPopularFilter(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              popularFilter ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Popular Spots
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {destinations.length} destination{destinations.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Destinations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : destinations.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 font-medium text-sm">No destinations found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => {
            const isFav = favourites.has(dest.id)

            return (
              <Link
                key={dest.id}
                href={`/destinations/${dest.id}`}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                  <button
                    onClick={(e) => toggleFavourite(e, dest.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:text-rose-500 shadow-md transition-colors"
                    title={isFav ? 'Remove from favourites' : 'Save to favourites'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`} />
                  </button>

                  <div className="absolute bottom-3 left-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-600/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {dest.country}
                    </span>
                    <h3 className="text-xl font-extrabold pt-1">{dest.name}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{dest.description}</p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      <span>{dest.location || dest.name}</span>
                    </div>

                    {dest.attractions && dest.attractions.length > 0 && (
                      <span className="text-[11px] text-brand-600 font-semibold">
                        {dest.attractions.length} attraction{dest.attractions.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
