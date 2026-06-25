import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, TrendingUp, Clock, CheckCircle, AlertTriangle, BarChart2 } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'

const StatCard = ({ icon, label, value, iconBg, to }) => (
  <Link to={to} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-zinc-100">{value ?? '—'}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  </Link>
)

export default function Dashboard() {
  const [jobStats, setJobStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  const loadStats = () => api.get('/jobs/stats').then(r => setJobStats(r.data)).catch(() => {})
  const loadAnalytics = () => api.get('/jobs/analytics').then(r => setAnalytics(r.data)).catch(() => {})

  useEffect(() => {
    loadStats()
    loadAnalytics()
    socket.on('job:created', loadStats)
    socket.on('job:updated', loadStats)
    return () => { socket.off('job:created', loadStats); socket.off('job:updated', loadStats) }
  }, [])

  const byStatus = arr => Object.fromEntries((arr ?? []).map(s => [s._id, s.count]))
  const jbs = byStatus(jobStats?.byStatus)
  const interviewCount = (jbs.interview_1 || 0) + (jbs.interview_2 || 0) + (jbs.interview_3 || 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>

      {/* Follow-up alert */}
      {analytics?.followUpNeeded > 0 && (
        <Link to="/jobs" className="flex items-center gap-3 bg-amber-950/20 border border-amber-800/40 rounded-2xl px-5 py-4 hover:bg-amber-950/30 transition">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-200">
              {analytics.followUpNeeded} application{analytics.followUpNeeded !== 1 ? 's' : ''} need follow-up
            </p>
            <p className="text-xs text-amber-500/80">Applied 7+ days ago with no response — open Job Tracker to review</p>
          </div>
        </Link>
      )}

      {/* Job stats */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Job Applications</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={<Briefcase size={18} className="text-blue-400" />} iconBg="bg-blue-950/50" label="Total" value={jobStats?.total} to="/jobs" />
          <StatCard icon={<TrendingUp size={18} className="text-violet-400" />} iconBg="bg-violet-950/50" label="Interviews" value={interviewCount} to="/jobs" />
          <StatCard icon={<Clock size={18} className="text-amber-400" />} iconBg="bg-amber-950/50" label="Applied / Awaiting" value={jbs.applied || 0} to="/jobs" />
          <StatCard icon={<CheckCircle size={18} className="text-emerald-400" />} iconBg="bg-emerald-950/50" label="Offers" value={(jbs.offer || 0) + (jbs.accepted || 0)} to="/jobs" />
        </div>
      </section>

      {/* Analytics summary */}
      {analytics && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">This Week's Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">Response Rate</p>
              <p className="text-2xl font-bold text-zinc-50">{analytics.responseRate}%</p>
              <p className="text-xs text-zinc-500 mt-1">of applications got a response</p>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <p className="text-xs text-zinc-400 mb-1">Active Pipeline</p>
              <p className="text-2xl font-bold text-zinc-50">{analytics.activeCount}</p>
              <p className="text-xs text-zinc-500 mt-1">applications in progress</p>
            </div>
            {analytics.avgDaysToResponse != null && (
              <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                <p className="text-xs text-zinc-400 mb-1">Avg. Days to Response</p>
                <p className="text-2xl font-bold text-zinc-50">{analytics.avgDaysToResponse}</p>
                <p className="text-xs text-zinc-500 mt-1">days from apply to first reply</p>
              </div>
            )}
          </div>

          {/* Mini bar chart */}
          {analytics.weeklyData?.some(w => w.count > 0) && (
            <div className="mt-4 bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={14} className="text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Applications per Week</p>
              </div>
              <div className="flex items-end gap-2 h-20">
                {analytics.weeklyData.map((w, i) => {
                  const max = Math.max(...analytics.weeklyData.map(x => x.count), 1)
                  const h = Math.round((w.count / max) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      {w.count > 0 && <span className="text-[10px] text-zinc-500">{w.count}</span>}
                      <div className="w-full bg-indigo-500/70 rounded-t transition-all" style={{ height: `${h}%`, minHeight: w.count ? 4 : 0 }} />
                      <span className="text-[9px] text-zinc-600 truncate w-full text-center">{w.week}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
