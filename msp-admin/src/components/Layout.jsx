import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import {
  LayoutDashboard, FileText, Briefcase,
  Settings, LogOut, Bell, TrendingUp, AlertCircle,
} from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/cv', icon: FileText, label: 'CV Manager' },
  { to: '/jobs', icon: Briefcase, label: 'Job Tracker' },
  { to: '/job-alerts', icon: Bell, label: 'Job Alerts' },
  { to: '/opportunities', icon: TrendingUp, label: 'Opportunities' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cvReady, setCvReady] = useState(null) // null = checking, true = has CV, false = no CV

  useEffect(() => {
    api.get('/cv')
      .then(r => {
        const ready = !!r.data?.profileData
        setCvReady(ready)
        if (!ready && location.pathname !== '/cv') navigate('/cv', { replace: true })
      })
      .catch(() => {
        setCvReady(false)
        if (location.pathname !== '/cv') navigate('/cv', { replace: true })
      })
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const isLocked = cvReady === false

  return (
    <div className="flex h-screen bg-zinc-950">
      <aside className="w-56 bg-zinc-900 border-r border-zinc-700/60 flex flex-col">
        <div className="p-5 border-b border-zinc-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg">📬</div>
            <div>
              <p className="font-semibold text-zinc-50 text-sm">Admin</p>
              <p className="text-xs text-zinc-400 truncate max-w-[100px]">{user?.name}</p>
            </div>
          </div>
        </div>

        {isLocked && (
          <div className="mx-3 mt-3 p-3 bg-amber-900/20 border border-amber-700/40 rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300 leading-relaxed">Set up your CV first to unlock all features.</p>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => {
            const locked = isLocked && to !== '/cv'
            return locked ? (
              <div
                key={to}
                title="Complete your CV first"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 cursor-not-allowed select-none"
              >
                <Icon size={17} />
                {label}
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-900/20 text-blue-300'
                      : 'text-zinc-300 hover:bg-zinc-950 hover:text-zinc-50'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-3 border-t border-zinc-700/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-red-900/20 hover:text-red-400 transition w-full"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ cvReady, setCvReady }} />
      </main>
    </div>
  )
}
