'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  PlusCircle,
  Trash2,
  Edit,
  UserPlus,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react'
import ExpenseChart from '@/components/ExpenseChart'
import ConfirmModal from '@/components/ConfirmModal'
import { TableSkeleton } from '@/components/LoadingSkeleton'

interface Activity {
  id: string
  name: string
  description?: string
  location?: string
  startTime?: string
  endTime?: string
}

interface ItineraryDay {
  id: string
  dayNumber: number
  date: string
  title: string
  description?: string
  activities: Activity[]
}

interface Expense {
  id: string
  category: 'Transportation' | 'Hotel' | 'Food' | 'Shopping' | 'Entertainment' | 'Miscellaneous'
  amount: number
  date: string
  description?: string
  payer: { id: string; name: string }
}

interface TripMember {
  id: string
  userId: string
  role: 'TRIP_OWNER' | 'GROUP_ADMIN' | 'MEMBER'
  user: { id: string; name: string; email: string }
}

interface JoinRequest {
  id: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  user: { name: string; email: string }
}

interface TripDetails {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  description?: string
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  ownerId: string
  owner: { id: string; name: string; email: string }
  members: TripMember[]
  itineraries: ItineraryDay[]
  budget?: { id: string; totalAmount: number; currency: string }
  expenses: Expense[]
  joinRequests: JoinRequest[]
}

export default function TripDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'budget' | 'members'>('overview')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modals & Form States
  const [addDayModal, setAddDayModal] = useState(false)
  const [dayTitle, setDayTitle] = useState('')
  const [dayDesc, setDayDesc] = useState('')

  const [addActivityModal, setAddActivityModal] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState('')
  const [actName, setActName] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actLoc, setActLoc] = useState('')
  const [actStart, setActStart] = useState('')
  const [actEnd, setActEnd] = useState('')

  const [setBudgetModal, setSetBudgetModal] = useState(false)
  const [budgtAmt, setBudgtAmt] = useState('')

  const [addExpenseModal, setAddExpenseModal] = useState(false)
  const [expCategory, setExpCategory] = useState<Expense['category']>('Food')
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')

  const [inviteModal, setInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'GROUP_ADMIN'>('MEMBER')

  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    type: 'trip' | 'member' | 'expense' | 'day' | 'activity'
    id: string
  }>({ open: false, type: 'trip', id: '' })

  const fetchTrip = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`)
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 403) {
        setFeedback({ type: 'error', message: 'You do not have access to view this private trip' })
        return
      }
      if (!res.ok) {
        setFeedback({ type: 'error', message: 'Trip not found' })
      } else {
        const data = await res.json()
        setTrip(data.trip)
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error fetching trip' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUserId(data.user.id)
      }
    } catch {}
  }

  useEffect(() => {
    fetchTrip()
    fetchCurrentUser()
  }, [tripId])

  if (loading) return <TableSkeleton />

  if (!trip) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-slate-500 font-medium">{feedback?.message || 'Trip unavailable.'}</p>
        <Link href="/trips" className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl text-sm">
          Return to My Trips
        </Link>
      </div>
    )
  }

  const isOwner = trip.ownerId === currentUserId
  const currentUserMemberRecord = trip.members.find((m) => m.userId === currentUserId)
  const isOwnerOrAdmin =
    isOwner ||
    currentUserMemberRecord?.role === 'TRIP_OWNER' ||
    currentUserMemberRecord?.role === 'GROUP_ADMIN'

  const totalSpent = trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalBudget = trip.budget?.totalAmount ? Number(trip.budget.totalAmount) : 0
  const budgetRatio = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Category Summaries for Expense Chart
  const expenseCategories: Record<string, number> = {
    Transportation: 0,
    Hotel: 0,
    Food: 0,
    Shopping: 0,
    Entertainment: 0,
    Miscellaneous: 0,
  }
  trip.expenses.forEach((e) => {
    const amt = Number(e.amount)
    if (expenseCategories[e.category] !== undefined) {
      expenseCategories[e.category] += amt
    } else {
      expenseCategories.Miscellaneous += amt
    }
  })
  const categoryChartData = Object.entries(expenseCategories).map(([category, amount]) => ({
    category,
    amount,
  }))

  // Handlers for Add / Update
  const handleAddItineraryDay = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: dayTitle, description: dayDesc }),
      })
      if (res.ok) {
        setAddDayModal(false)
        setDayTitle('')
        setDayDesc('')
        fetchTrip()
      }
    } catch {}
  }

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/trips/${tripId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryDayId: selectedDayId,
          name: actName,
          description: actDesc,
          location: actLoc,
          startTime: actStart,
          endTime: actEnd,
        }),
      })
      if (res.ok) {
        setAddActivityModal(false)
        setActName('')
        setActDesc('')
        setActLoc('')
        setActStart('')
        setActEnd('')
        fetchTrip()
      }
    } catch {}
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount: parseFloat(budgtAmt) }),
      })
      if (res.ok) {
        setSetBudgetModal(false)
        fetchTrip()
      }
    } catch {}
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expAmount || Number(expAmount) < 0) {
      setFeedback({ type: 'error', message: 'Expense amount must be a positive number' })
      return
    }
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          amount: parseFloat(expAmount),
          description: expDesc,
        }),
      })
      if (res.ok) {
        setAddExpenseModal(false)
        setExpAmount('')
        setExpDesc('')
        fetchTrip()
      }
    } catch {}
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to add member' })
      } else {
        setInviteModal(false)
        setInviteEmail('')
        setFeedback({ type: 'success', message: 'Member added to trip successfully' })
        fetchTrip()
      }
    } catch {}
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      if (res.ok) fetchTrip()
    } catch {}
  }

  const handleJoinRequestAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/trips/${tripId}/join-request`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      })
      if (res.ok) fetchTrip()
    } catch {}
  }

  const handleConfirmDelete = async () => {
    const { type, id } = confirmDelete
    setConfirmDelete({ open: false, type: 'trip', id: '' })

    if (type === 'trip') {
      await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
      router.push('/trips')
    } else if (type === 'expense') {
      await fetch(`/api/trips/${tripId}/expenses?expenseId=${id}`, { method: 'DELETE' })
      fetchTrip()
    } else if (type === 'member') {
      await fetch(`/api/trips/${tripId}/members?memberId=${id}`, { method: 'DELETE' })
      fetchTrip()
    }
  }

  return (
    <div className="space-y-6 py-4">
      {/* Top Navigation Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </Link>

        {isOwner && (
          <button
            onClick={() => setConfirmDelete({ open: true, type: 'trip', id: tripId })}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Trip
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border border-rose-100 text-rose-600'
              : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Trip Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-brand-500/30 text-brand-300 text-xs font-bold rounded-full border border-brand-400/20 uppercase tracking-wider">
              {trip.status}
            </span>
            <span className="text-xs text-slate-300">
              Owned by <strong className="text-white">{trip.owner.name}</strong>
            </span>
          </div>

          <div className="text-xs text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{trip.name}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <MapPin className="w-4 h-4 text-brand-400" />
          <span>{trip.destination}</span>
        </div>
      </div>

      {/* Workspace Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview & Stats
        </button>

        <button
          onClick={() => setActiveTab('itinerary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'itinerary' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Itinerary & Activities ({trip.itineraries.length})
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'budget' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Budget & Expenses (${totalSpent.toLocaleString()})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'members' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Members ({trip.members.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Trip Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {trip.description || 'No specific description added yet for this trip.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Quick Itinerary Preview</h3>
              {trip.itineraries.length === 0 ? (
                <p className="text-xs text-slate-400">No itinerary days configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {trip.itineraries.slice(0, 3).map((day) => (
                    <div key={day.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>Day {day.dayNumber}: {day.title}</span>
                        <span className="text-slate-400 font-normal">{new Date(day.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500">{day.activities.length} activities scheduled</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Budget Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-slate-400">Budget Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Spent: ${totalSpent.toLocaleString()}</span>
                  <span>Target: ${totalBudget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetRatio >= 100 ? 'bg-rose-500' : budgetRatio >= 80 ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.min(100, budgetRatio)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Members Quick List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-slate-400">Travel Members</h3>
              <div className="space-y-2">
                {trip.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs py-1">
                    <span className="font-semibold text-slate-800">{m.user.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ITINERARY & ACTIVITIES */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900">Trip Itinerary</h2>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setAddDayModal(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Add Day
              </button>
            )}
          </div>

          {trip.itineraries.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <p className="text-slate-500 text-sm">No itinerary days added yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {trip.itineraries.map((day) => (
                <div key={day.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                        Day {day.dayNumber} • {new Date(day.date).toLocaleDateString()}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{day.title}</h3>
                      {day.description && <p className="text-xs text-slate-500">{day.description}</p>}
                    </div>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => {
                          setSelectedDayId(day.id)
                          setAddActivityModal(true)
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Activity
                      </button>
                    )}
                  </div>

                  {/* Activities List */}
                  {day.activities.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No activities added for this day.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {day.activities.map((act) => (
                        <div key={act.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                          <h4 className="font-bold text-slate-800 text-sm">{act.name}</h4>
                          {act.description && <p className="text-xs text-slate-500">{act.description}</p>}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                            {act.location && <span>📍 {act.location}</span>}
                            {act.startTime && <span>⏰ {act.startTime} {act.endTime ? `- ${act.endTime}` : ''}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUDGET & EXPENSES */}
      {activeTab === 'budget' && (
        <div className="space-y-8">
          {/* Budget Overview Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Budget Tracker</h2>
                <p className="text-xs text-slate-500">Monetary values managed via PostgreSQL Decimal</p>
              </div>

              <div className="flex gap-2">
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => {
                      setBudgtAmt(totalBudget.toString())
                      setSetBudgetModal(true)
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Edit Total Budget
                  </button>
                )}

                <button
                  onClick={() => setAddExpenseModal(true)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Add Expense
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Total Budget</span>
                <p className="text-2xl font-extrabold text-slate-900">${totalBudget.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Total Spent</span>
                <p className="text-2xl font-extrabold text-brand-600">${totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Remaining Budget</span>
                <p
                  className={`text-2xl font-extrabold ${
                    totalBudget - totalSpent < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  ${(totalBudget - totalSpent).toLocaleString()}
                </p>
              </div>
            </div>

            <ExpenseChart data={categoryChartData} currency={trip.budget?.currency} />
          </div>

          {/* Expense Log Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Expense Log</h3>

            {trip.expenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No expenses recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Amount</th>
                      <th className="p-3 font-semibold">Payer</th>
                      <th className="p-3 font-semibold">Description</th>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trip.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{exp.category}</td>
                        <td className="p-3 font-bold text-brand-600">${Number(exp.amount).toFixed(2)}</td>
                        <td className="p-3 text-slate-600">{exp.payer?.name}</td>
                        <td className="p-3 text-slate-500">{exp.description || '-'}</td>
                        <td className="p-3 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setConfirmDelete({ open: true, type: 'expense', id: exp.id })}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS & COLLABORATION */}
      {activeTab === 'members' && (
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Trip Members & Roles</h2>
                <p className="text-xs text-slate-500">Trip Owner & Group Admins can manage members</p>
              </div>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => setInviteModal(true)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Add Member
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {trip.members.map((m) => (
                <div key={m.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm">
                      {m.user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{m.user.name}</h4>
                      <p className="text-xs text-slate-400">{m.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwnerOrAdmin && m.userId !== trip.ownerId ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)}
                        className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="GROUP_ADMIN">GROUP_ADMIN</option>
                        <option value="TRIP_OWNER">TRIP_OWNER</option>
                      </select>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full text-xs">
                        {m.role}
                      </span>
                    )}

                    {isOwnerOrAdmin && m.userId !== trip.ownerId && (
                      <button
                        onClick={() => setConfirmDelete({ open: true, type: 'member', id: m.id })}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Join Requests Panel (For Admin/Owner) */}
          {isOwnerOrAdmin && trip.joinRequests?.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Pending Join Requests</h3>
              <div className="space-y-3">
                {trip.joinRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{req.user.name}</h4>
                      <p className="text-xs text-slate-400">{req.user.email} • Status: {req.status}</p>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRequestAction(req.id, 'APPROVED')}
                          className="px-3 py-1 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleJoinRequestAction(req.id, 'REJECTED')}
                          className="px-3 py-1 bg-rose-600 text-white font-semibold text-xs rounded-lg hover:bg-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add Day Modal */}
      {addDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleAddItineraryDay} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Itinerary Day</h3>
            <input
              type="text"
              required
              value={dayTitle}
              onChange={(e) => setDayTitle(e.target.value)}
              placeholder="e.g. Exploring Temple District"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <textarea
              rows={2}
              value={dayDesc}
              onChange={(e) => setDayDesc(e.target.value)}
              placeholder="Day summary or main highlights..."
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAddDayModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl">
                Save Day
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Activity Modal */}
      {addActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleAddActivity} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Activity</h3>
            <input
              type="text"
              required
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              placeholder="Activity Name (e.g. Visit Golden Pavilion)"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <input
              type="text"
              value={actLoc}
              onChange={(e) => setActLoc(e.target.value)}
              placeholder="Location (e.g. Kita Ward)"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={actStart}
                onChange={(e) => setActStart(e.target.value)}
                placeholder="Start Time (e.g. 10:00 AM)"
                className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
              />
              <input
                type="text"
                value={actEnd}
                onChange={(e) => setActEnd(e.target.value)}
                placeholder="End Time (e.g. 12:30 PM)"
                className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
              />
            </div>
            <textarea
              rows={2}
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              placeholder="Notes or ticket details..."
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAddActivityModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl">
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Add Expense Modal */}
      {addExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleAddExpense} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Expense</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold"
              >
                <option value="Transportation">Transportation</option>
                <option value="Hotel">Hotel</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Amount ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="45.50"
                className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <input
                type="text"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="e.g. Lunch at ramen street"
                className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAddExpenseModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Edit Budget Modal */}
      {setBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleSaveBudget} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Set Trip Budget</h3>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={budgtAmt}
              onChange={(e) => setBudgtAmt(e.target.value)}
              placeholder="3000"
              className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSetBudgetModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl">
                Save Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Invite Member Modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleInviteMember} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Invite Traveler</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Member Email *</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="traveler@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Assign Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="GROUP_ADMIN">GROUP_ADMIN</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setInviteModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl">
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title={`Delete ${confirmDelete.type}`}
        message="Are you sure you want to proceed with this deletion? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ open: false, type: 'trip', id: '' })}
      />
    </div>
  )
}
