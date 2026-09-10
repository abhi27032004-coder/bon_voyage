import Link from 'next/link'
import { Compass, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-800">VoyageCraft</span>
            <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
              Next-Gen Travel Planning & Collaboration
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
            <Link href="/destinations" className="hover:text-brand-600 transition-colors">
              Destinations
            </Link>
            <Link href="/trips" className="hover:text-brand-600 transition-colors">
              My Trips
            </Link>
            <Link href="/history" className="hover:text-brand-600 transition-colors">
              Travel History
            </Link>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for travelers worldwide
          </div>
        </div>
      </div>
    </footer>
  )
}
