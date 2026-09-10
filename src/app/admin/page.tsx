'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Users, Calendar, MapPin, DollarSign, Bell, PlusCircle, AlertCircle } from 'lucide-react'
import { CardSkeleton, TableSkeleton } from '@/components/LoadingSkeleton'

interface AdminData {
  userAnalytics: { totalUsers: number }
  tripAnalytics: {
    totalTrips: number
    activeTrips: number
    completedTrips: number
    upcomingTrips: number
  }
  destinationAnalytics: {
    totalDestinations: number
    popularDestinationsCount: number
    topDestinations: any[]
  }
  platformStats: {
    totalExpenses: number
    totalExpenseVolume: number
    totalNotifications: number
  }
  recentUsers: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  // Create destination modal
  const [destModal, setDestModal] = useState(false)
  const [dName, setDName] = useState('')
  const [dCountry, setDCountry] = useState('')
  const [dDesc, setDDesc] = useState('')
  const [dImg, setDImg] = useState('')
  const [dPopular, setDPopular] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      console.error('Failed to load admin metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dName,
          country: dCountry,
          description: dDesc,
          image: dImg,
          popular: dPopular,
        }),
      })
      if (res.ok) {
        setDestModal(false)
        setDName('')
        setDCountry('')
        setDDesc('')
        setDImg('')
        setMsg('Destination created successfully!')
        fetchAdminData()
      }
    } catch {}
  }

  if (loading) return <CardSkeleton />

  if (forbidden) {
    return (
      <div className="py-16 text-center space-y-4 bg-rose-50 border border-rose-100 rounded-3xl p-8 max-w-md mx-auto my-10 text-rose-700">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold">403 Forbidden Access</h2>
        <p className="text-xs leading-relaxed">
          Access denied. The Admin Dashboard is restricted strictly to accounts with the <strong>ADMIN</strong> role.
        </p>
      </div>
    )
  }

  if (!data) return null

  const { userAnalytics, tripAnalytics, destinationAnalytics, platformStats, recentUsers } = data

  return (
    <div className="space-y-8 py-4">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Platform Governance & Analytics
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-300">Live platform metrics & system oversight</p>
        </div>

        <button
          onClick={() => setDestModal(true)}
          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Add New Destination
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-2xl">
          {msg}
        </div>
      )}

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>User Analytics</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{userAnalytics.totalUsers}</p>
          <span className="text-[11px] text-slate-400">Total registered accounts</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Trip Analytics</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{tripAnalytics.totalTrips}</p>
          <span className="text-[11px] text-slate-400">
            {tripAnalytics.activeTrips} active • {tripAnalytics.completedTrips} completed
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Destinations</span>
            <MapPin className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{destinationAnalytics.totalDestinations}</p>
          <span className="text-[11px] text-slate-400">{destinationAnalytics.popularDestinationsCount} marked popular</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Platform Volume</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">${platformStats.totalExpenseVolume.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400">{platformStats.totalExpenses} total expense records</span>
        </div>
      </div>

      {/* Recent Users List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Registered Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-800">{u.name}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Destination Modal */}
      {destModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleCreateDestination} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Destination</h3>
            <input
              type="text"
              required
              value={dName}
              onChange={(e) => setDName(e.target.value)}
              placeholder="City/Region Name (e.g. Reykjavik)"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <input
              type="text"
              required
              value={dCountry}
              onChange={(e) => setDCountry(e.target.value)}
              placeholder="Country (e.g. Iceland)"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <input
              type="url"
              value={dImg}
              onChange={(e) => setDImg(e.target.value)}
              placeholder="Image URL (Unsplash or direct image link)"
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <textarea
              rows={3}
              required
              value={dDesc}
              onChange={(e) => setDDesc(e.target.value)}
              placeholder="Description & travel highlights..."
              className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm"
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={dPopular}
                onChange={(e) => setDPopular(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              Mark as Popular Destination
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDestModal(false)} className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl">
                Create Destination
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
