import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FileText, Briefcase, MessageSquare,
  Settings, LogOut, Bell, TrendingUp,
} from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/cv', icon: FileText, label: 'CV Manager' },
  { to: '/jobs', icon: Briefcase, label: 'Job Tracker' },
  { to: '/job-alerts', icon: Bell, label: 'Job Alerts' },
  { to: '/opportunities', icon: TrendingUp, label: 'Opportunities' },
  { to: '/enquiries', icon: MessageSquare, label: 'Enquiries' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

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
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
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
          ))}
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
        <Outlet />
      </main>
    </div>
  )
}
