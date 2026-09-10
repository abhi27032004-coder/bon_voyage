'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { History as HistoryIcon, Calendar, MapPin, DollarSign, CheckCircle2, Compass } from 'lucide-react'
import { TableSkeleton } from '@/components/LoadingSkeleton'

interface HistoryTrip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: string
  expenses: Array<{ amount: number }>
}

interface HistoryResponse {
  historyTrips: HistoryTrip[]
  metrics: {
    totalCompletedTrips: number
    totalSpentInHistory: number
    uniqueDestinationsCount: number
    uniqueDestinations: string[]
  }
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/history')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        console.error('Failed to load travel history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) return <TableSkeleton />

  if (!data) return null

  const { historyTrips, metrics } = data

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-3xl p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider">
          <HistoryIcon className="w-4 h-4 text-cyan-400" /> Travel Memories & History
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Travel History</h1>
        <p className="text-sm text-slate-300">
          A full log of your completed journeys, total expenses, and visited destinations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block">Completed Journeys</span>
            <span className="text-xl font-extrabold text-white">{metrics.totalCompletedTrips}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Historical Expenditure</span>
            <span className="text-xl font-extrabold text-emerald-400">${metrics.totalSpentInHistory.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Unique Destinations</span>
            <span className="text-xl font-extrabold text-cyan-300">{metrics.uniqueDestinationsCount}</span>
          </div>
        </div>
      </div>

      {/* History List */}
      {historyTrips.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <HistoryIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Completed Trips Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Once your planned trips conclude, they will automatically populate your travel history log.
          </p>
          <Link href="/trips" className="inline-block px-4 py-2 bg-brand-600 text-white font-semibold text-xs rounded-xl">
            View Current Trips
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {historyTrips.map((trip) => {
            const spent = trip.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {trip.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> COMPLETED
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-brand-500" /> {trip.destination}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />{' '}
                        {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-xs text-slate-400 block">Total Spent</span>
                    <span className="text-lg font-extrabold text-slate-900">${spent.toLocaleString()}</span>
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
