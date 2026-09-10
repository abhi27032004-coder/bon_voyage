'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  PlusCircle,
  MapPin,
  Search,
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react'
import { CardSkeleton } from '@/components/LoadingSkeleton'

interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  description?: string
  owner: { name: string; email: string }
  budget?: { totalAmount: number; currency: string }
  members: Array<{ user: { name: string; email: string } }>
  expenses: Array<{ amount: number }>
}

interface SearchTripResult {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  owner: { name: string; email: string }
  isMember: boolean
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Search & Join Modal State
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchTripResult[]>([])
  const [searching, setSearching] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')

  const fetchTrips = async () => {
    try {
      const url = filterStatus !== 'ALL' ? `/api/trips?status=${filterStatus}` : '/api/trips'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setTrips(data.trips || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [filterStatus])

  const handleSearchTrips = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setJoinMessage('')
    try {
      const res = await fetch(`/api/trips/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.trips || [])
      }
    } catch {
      console.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleRequestJoin = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/join-request`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setJoinMessage('Join request sent successfully!')
        setSearchResults((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, requestStatus: 'PENDING' } : t))
        )
      } else {
        setJoinMessage(data.error || 'Failed to send request')
      }
    } catch {
      setJoinMessage('Error sending request')
    }
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">My Trips</h1>
          <p className="text-slate-500 text-sm">Manage itineraries, budgets, and collaboration</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" /> Find Public Trip
          </button>

          <Link
            href="/trips/new"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create Trip
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === st
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : trips.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Trips Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              You haven't created or joined any trips matching status "{filterStatus}".
            </p>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brand-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Plan a Trip Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const spent = trip.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
            const budgetAmt = trip.budget?.totalAmount ? Number(trip.budget.totalAmount) : 0

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        trip.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : trip.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      {trip.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Owner: {trip.owner?.name || 'You'}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {trip.name}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>{trip.destination}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{trip.members?.length || 1} members</span>
                  </div>

                  <div className="font-bold text-slate-900">
                    ${spent.toLocaleString()} {budgetAmt > 0 && <span className="text-slate-400 font-normal">/ ${budgetAmt.toLocaleString()}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Find & Join Trip Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSearchModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Search & Join Trips</h3>
              <p className="text-xs text-slate-500">Enter a trip name or destination to request joining.</p>
            </div>

            {joinMessage && (
              <div className="p-3 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> {joinMessage}
              </div>
            )}

            <form onSubmit={handleSearchTrips} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by trip name or destination..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-3 pt-2">
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No matching trips found yet.</p>
              ) : (
                searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                      <p className="text-slate-500">{t.destination} • Owner: {t.owner?.name}</p>
                    </div>

                    {t.isMember ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-[10px]">
                        Already Member
                      </span>
                    ) : t.requestStatus === 'PENDING' ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-bold rounded-full text-[10px]">
                        Request Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequestJoin(t.id)}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Request Join
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
