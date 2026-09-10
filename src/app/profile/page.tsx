'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Heart, Sparkles, Edit, Shield, Save, CheckCircle2 } from 'lucide-react'
import { CardSkeleton } from '@/components/LoadingSkeleton'

interface ProfileData {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  travelPreferences?: string
  createdAt: string
  favouriteDestinations: Array<{
    id: string
    destination: {
      id: string
      name: string
      country: string
      image: string
    }
  }>
  ownedTrips: Array<{
    id: string
    name: string
    destination: string
    status: string
  }>
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [travelPreferences, setTravelPreferences] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setName(data.profile.name || '')
        setTravelPreferences(data.profile.travelPreferences || '')
      }
    } catch {
      console.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, travelPreferences }),
      })
      if (res.ok) {
        setMsg('Profile updated successfully in PostgreSQL!')
        setEditing(false)
        fetchProfile()
      }
    } catch {
      setMsg('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <CardSkeleton />
  if (!profile) return null

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
            {profile.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{profile.name}</h1>
              {profile.role === 'ADMIN' && (
                <span className="px-2.5 py-0.5 bg-rose-500/30 text-rose-300 font-bold text-[10px] rounded-full border border-rose-400/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 pt-1">
              <Mail className="w-3.5 h-3.5 text-brand-400" /> {profile.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-1.5 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" /> {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* Main Info Form / Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Personal Details</h2>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Travel Preferences</label>
                  <textarea
                    rows={4}
                    value={travelPreferences}
                    onChange={(e) => setTravelPreferences(e.target.value)}
                    placeholder="e.g. Cultural Heritage, Mountain Hiking, Photography, Luxury Resorts..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Account Role</span>
                  <span className="font-bold text-slate-800">{profile.role}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Travel Preferences</span>
                  <p className="text-slate-700 font-medium pt-1">
                    {profile.travelPreferences || 'No specific preferences added yet.'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase block">Member Since</span>
                  <span className="text-slate-600">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Saved Favourites Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="text-lg font-bold text-slate-900">Saved Spots ({profile.favouriteDestinations.length})</h2>
            </div>

            {profile.favouriteDestinations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No saved favourite destinations yet.</p>
            ) : (
              <div className="space-y-3">
                {profile.favouriteDestinations.map((fav) => (
                  <Link
                    key={fav.id}
                    href={`/destinations/${fav.destination.id}`}
                    className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                  >
                    <img
                      src={fav.destination.image}
                      alt={fav.destination.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-brand-600">{fav.destination.name}</h4>
                      <p className="text-[10px] text-slate-400">{fav.destination.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
