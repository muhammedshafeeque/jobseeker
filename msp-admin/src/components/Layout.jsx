import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import {
  LayoutDashboard, FileText, Briefcase,
  Settings, LogOut, Bell, TrendingUp, AlertCircle, Menu, X,
} from 'lucide-react'

const nav = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/cv',           icon: FileText,        label: 'CV Manager'              },
  { to: '/jobs',         icon: Briefcase,       label: 'Job Tracker'             },
  { to: '/job-alerts',   icon: Bell,            label: 'Job Alerts'              },
  { to: '/opportunities',icon: TrendingUp,      label: 'Opportunities'           },
  { to: '/settings',     icon: Settings,        label: 'Settings'                },
]

function SidebarInner({ user, isLocked, onLogout }) {
  return (
    <>
      <div className="p-5 border-b border-zinc-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg shrink-0">📬</div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-50 text-sm">Admin</p>
            <p className="text-xs text-zinc-400 truncate">{user?.name}</p>
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="mx-3 mt-3 p-3 bg-amber-900/20 border border-amber-700/40 rounded-xl flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300 leading-relaxed">Set up your CV first to unlock all features.</p>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end }) => {
          const locked = isLocked && to !== '/cv'
          return locked ? (
            <div key={to} title="Complete your CV first"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 cursor-not-allowed select-none">
              <Icon size={17} className="shrink-0" />{label}
            </div>
          ) : (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-900/30 text-indigo-300'
                    : 'text-zinc-300 hover:bg-zinc-950 hover:text-zinc-50'
                }`
              }>
              <Icon size={17} className="shrink-0" />{label}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-700/60 shrink-0">
        <button onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-red-900/20 hover:text-red-400 transition w-full">
          <LogOut size={17} className="shrink-0" />Log out
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cvReady, setCvReady] = useState(null)
  const [open, setOpen] = useState(false)

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

  useEffect(() => { setOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }
  const isLocked = cvReady === false

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-zinc-900 border-r border-zinc-700/60 flex-col">
        <SidebarInner user={user} isLocked={isLocked} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile sidebar overlay ──────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-64 shrink-0 bg-zinc-900 border-r border-zinc-700/60 flex flex-col h-full shadow-2xl z-10">
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition z-10">
              <X size={18} />
            </button>
            <SidebarInner user={user} isLocked={isLocked} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-sm shrink-0">📬</div>
            <span className="font-semibold text-zinc-100 text-sm tracking-tight">velayillay.online</span>
          </div>
          <button onClick={() => setOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition">
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet context={{ cvReady, setCvReady }} />
        </main>
      </div>
    </div>
  )
}
