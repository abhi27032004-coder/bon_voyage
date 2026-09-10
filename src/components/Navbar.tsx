'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  MapPin,
  Calendar,
  History as HistoryIcon,
  User,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Sparkles,
} from 'lucide-react'
import NotificationBell from './NotificationBell'

interface UserData {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
    router.refresh()
  }

  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Voyage<span className="text-brand-600">Craft</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/dashboard'
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Dashboard
              </Link>

              <Link
                href="/trips"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/trips')
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" /> Trips
              </Link>

              <Link
                href="/destinations"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/destinations')
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4" /> Destinations
              </Link>

              <Link
                href="/history"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/history'
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <HistoryIcon className="w-4 h-4" /> History
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'bg-rose-50 text-rose-600'
                      : 'text-rose-600 hover:bg-rose-50/50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" /> Admin
                </Link>
              )}
            </div>
          )}

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  href="/trips/new"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Plan Trip
                </Link>

                <NotificationBell />

                {/* Profile dropdown trigger */}
                <div className="relative flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 hover:opacity-85 transition-opacity"
                    title="Profile & Settings"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden lg:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : !loading && !isAuthPage ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ) : null}

            {/* Mobile menu button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-200">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Sparkles className="w-4 h-4 text-brand-600" /> Dashboard
          </Link>
          <Link
            href="/trips"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="w-4 h-4 text-brand-600" /> Trips
          </Link>
          <Link
            href="/destinations"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <MapPin className="w-4 h-4 text-brand-600" /> Destinations
          </Link>
          <Link
            href="/history"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <HistoryIcon className="w-4 h-4 text-brand-600" /> History
          </Link>
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <User className="w-4 h-4 text-brand-600" /> Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings className="w-4 h-4 text-brand-600" /> Settings
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Admin Dashboard
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/trips/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Create New Trip
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
