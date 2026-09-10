import Link from 'next/link'
import {
  Compass,
  MapPin,
  Users,
  DollarSign,
  CloudSun,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-14 md:p-20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Crafted for Modern Travelers & Group Explorers
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Craft Extraordinary Journeys, <span className="bg-gradient-to-r from-brand-400 via-cyan-300 to-sky-200 bg-clip-text text-transparent">Together.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
            The all-in-one travel SaaS platform to curate itineraries, manage expenses with real-time budget alerts, discover live weather, and collaborate seamlessly with friends.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white font-semibold text-base rounded-2xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Start Planning for Free <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/destinations"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition-all"
            >
              <Compass className="w-5 h-5 text-cyan-300" /> Explore Destinations
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Smart Budget Alerts
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-Time Weather
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-User Roles
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Everything You Need for Seamless Trips
          </h2>
          <p className="text-slate-600">
            Built from the ground up for modern individuals, families, and travel groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Group Collaboration</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Invite friends by email, assign roles (Owner, Group Admin, Member), and process trip join requests with custom notifications.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Budget & Expense Analytics</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Track spending across Transportation, Hotel, Food, and Shopping. Automatic 80% & 100% threshold notifications prevent overspending.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <CloudSun className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Live Weather & Attractions</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Get real-time temperature, wind, and forecast conditions for any destination, paired with top attractions and location maps.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-gradient-to-r from-brand-600 to-cyan-600 rounded-3xl p-10 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-3xl font-extrabold">Ready to Craft Your Next Adventure?</h2>
          <p className="text-brand-100 text-sm">
            Join thousands of travelers who organize trips, manage budgets, and collaborate effortlessly.
          </p>
        </div>
        <Link
          href="/register"
          className="px-8 py-4 bg-white text-brand-700 hover:bg-brand-50 font-bold rounded-2xl shadow-lg transition-all text-center shrink-0"
        >
          Create Free Account
        </Link>
      </section>
    </div>
  )
}
