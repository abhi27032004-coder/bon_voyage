'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Calendar,
  DollarSign,
  MapPin,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Heart,
  Globe,
  Compass,
  AlertCircle,
} from 'lucide-react'
import ExpenseChart from '@/components/ExpenseChart'
import { CardSkeleton, GridSkeleton } from '@/components/LoadingSkeleton'

interface DashboardData {
  upcomingTrips: Array<{
    id: string
    name: string
    destination: string
    startDate: string
    endDate: string
    status: string
    budget?: { totalAmount: number; currency: string }
    expenses: Array<{ amount: number }>
  }>
  budgetOverview: {
    totalBudget: number
    totalSpent: number
    remainingBudget: number
  }
  expenseSummary: Array<{ category: string; amount: number }>
  favouriteDestinations: Array<{
    id: string
    name: string
    country: string
    image: string
  }>
  mostVisitedDestinations: Array<{ name: string; count: number }>
  statistics: {
    totalTrips: number
    activeTrips: number
    completedTrips: number
    totalDestinationsVisited: number
    totalAmountSpent: number
    unreadNotificationsCount: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        setError('Failed to load dashboard metrics')
      } else {
        const json = await res.json()
        setData(json)
      }
    } catch {
      setError('Network error while loading dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 py-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <GridSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 text-sm font-medium flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span>{error || 'Unable to load dashboard data.'}</span>
      </div>
    )
  }

  const {
    upcomingTrips,
    budgetOverview,
    expenseSummary,
    favouriteDestinations,
    mostVisitedDestinations,
    statistics,
  } = data

  const percentSpent =
    budgetOverview.totalBudget > 0
      ? Math.min(100, Math.round((budgetOverview.totalSpent / budgetOverview.totalBudget) * 100))
      : 0

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-brand-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Travel Analytics Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Travel Overview</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time aggregates calculated directly from PostgreSQL
          </p>
        </div>

        <Link
          href="/trips/new"
          className="px-5 py-3 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white font-semibold text-sm rounded-2xl shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Plan New Trip
        </Link>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Trips</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{statistics.totalTrips}</p>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{statistics.activeTrips} active</span> • {statistics.completedTrips} completed
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Destinations Visited</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{statistics.totalDestinationsVisited}</p>
          <div className="text-[11px] text-slate-400">Unique locations explored</div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Budget</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">${budgetOverview.totalBudget.toLocaleString()}</p>
          <div className="text-[11px] text-slate-400">Sum of allocated budgets</div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Spent</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">${budgetOverview.totalSpent.toLocaleString()}</p>
          <div className="text-[11px] text-slate-400">
            {percentSpent}% of total budget used
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Trips & Budget Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Trips */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-slate-900">Upcoming Trips</h2>
              </div>
              <Link
                href="/trips"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingTrips.length === 0 ? (
              <div className="py-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm">No upcoming trips planned yet.</p>
                <Link
                  href="/trips/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Create Your First Trip
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingTrips.map((trip) => {
                  const spent = trip.expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="block p-5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:shadow-sm group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                              {trip.name}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                trip.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-brand-100 text-brand-700'
                              }`}
                            >
                              {trip.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {trip.destination}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />{' '}
                              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-right sm:self-center">
                          <span className="text-xs text-slate-500">Spent / Budget</span>
                          <p className="text-sm font-bold text-slate-800">
                            ${spent.toLocaleString()} / ${trip.budget?.totalAmount ? Number(trip.budget.totalAmount).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Expense Category Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Expenses by Category</h2>
              <span className="text-xs text-slate-400">PostgreSQL Aggregated</span>
            </div>
            <ExpenseChart data={expenseSummary} />
          </div>
        </div>

        {/* Right Column: Budget Utilization Progress & Destinations */}
        <div className="space-y-8">
          {/* Budget Overview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Budget Utilization</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Overall Spent</span>
                <span>{percentSpent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    percentSpent >= 100
                      ? 'bg-rose-500'
                      : percentSpent >= 80
                      ? 'bg-amber-500'
                      : 'bg-brand-500'
                  }`}
                  style={{ width: `${percentSpent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Remaining: ${Math.max(0, budgetOverview.remainingBudget).toLocaleString()}</span>
                <span>Limit: ${budgetOverview.totalBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Favourite Destinations */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h2 className="text-lg font-bold text-slate-900">Favourite Spots</h2>
              </div>
              <Link href="/destinations" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Browse
              </Link>
            </div>

            {favouriteDestinations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No saved favourites yet. Explore destinations to add your top spots!</p>
            ) : (
              <div className="space-y-3">
                {favouriteDestinations.map((fav) => (
                  <Link
                    key={fav.id}
                    href={`/destinations/${fav.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors group"
                  >
                    <img
                      src={fav.image}
                      alt={fav.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-brand-600 transition-colors">
                        {fav.name}
                      </h4>
                      <p className="text-xs text-slate-400">{fav.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Most Visited Destinations */}
          {mostVisitedDestinations.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-slate-400">
                Most Visited Destinations
              </h2>
              <div className="space-y-2">
                {mostVisitedDestinations.map((dest, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                    <span className="font-medium text-slate-700">{dest.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full font-bold text-slate-600">
                      {dest.count} trip{dest.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
