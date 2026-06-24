import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'

const statCard = (icon, label, value, color, to) => (
  <Link to={to} key={label} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-700/60 hover:shadow-md transition flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-zinc-50">{value ?? '—'}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  </Link>
)

export default function Dashboard() {
  const [jobStats, setJobStats] = useState(null)
  const [contactStats, setContactStats] = useState(null)

  const load = async () => {
    const [j, c] = await Promise.all([
      api.get('/jobs/stats').then(r => r.data),
      api.get('/contacts/stats').then(r => r.data),
    ])
    setJobStats(j)
    setContactStats(c)
  }

  useEffect(() => {
    load()
    socket.on('job:created', load)
    socket.on('job:updated', load)
    socket.on('contact:new', load)
    socket.on('contact:updated', load)
    return () => {
      socket.off('job:created', load)
      socket.off('job:updated', load)
      socket.off('contact:new', load)
      socket.off('contact:updated', load)
    }
  }, [])

  const byStatus = arr => Object.fromEntries((arr ?? []).map(s => [s._id, s.count]))
  const jbs = byStatus(jobStats?.byStatus)
  const cts = byStatus(contactStats?.byStatus)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-50 mb-6">Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Job Applications</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCard(<Briefcase size={22} className="text-blue-400" />, 'Total', jobStats?.total, 'bg-blue-900/20', '/jobs')}
          {statCard(<TrendingUp size={22} className="text-emerald-400" />, 'Interviews', (jbs.interview_1 || 0) + (jbs.interview_2 || 0) + (jbs.interview_3 || 0), 'bg-emerald-900/20', '/jobs?status=interview_1')}
          {statCard(<Clock size={22} className="text-amber-400" />, 'Awaiting Response', jbs.applied || 0, 'bg-amber-900/20', '/jobs?status=applied')}
          {statCard(<TrendingUp size={22} className="text-purple-400" />, 'Offers', jbs.offer || 0, 'bg-purple-900/20', '/jobs?status=offer')}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Enquiries</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCard(<MessageSquare size={22} className="text-rose-400" />, 'Total', contactStats?.total, 'bg-rose-900/20', '/enquiries')}
          {statCard(<MessageSquare size={22} className="text-rose-300" />, 'Unread', cts.unread || 0, 'bg-rose-900/40', '/enquiries?status=unread')}
          {statCard(<MessageSquare size={22} className="text-indigo-400" />, 'Connected', cts.connected || 0, 'bg-indigo-900/20', '/enquiries?status=connected')}
          {statCard(<MessageSquare size={22} className="text-zinc-400" />, 'Closed', cts.closed || 0, 'bg-zinc-800', '/enquiries?status=closed')}
        </div>
      </section>
    </div>
  )
}
