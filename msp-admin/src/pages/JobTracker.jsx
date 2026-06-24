import { useEffect, useState } from 'react'
import { Plus, ChevronRight, Building2, RefreshCw, Loader2, X, Briefcase } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { downloadResumePdf } from '../lib/resumePdf'

const parseTailored = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

const STATUSES = [
  { value: 'draft',        label: 'Draft',          color: 'bg-zinc-800 text-zinc-300' },
  { value: 'applied',      label: 'Applied',         color: 'bg-blue-900/40 text-blue-300' },
  { value: 'responded',    label: 'Responded',       color: 'bg-cyan-900/40 text-cyan-300' },
  { value: 'phone_screen', label: 'Phone Screen',    color: 'bg-yellow-900/40 text-yellow-300' },
  { value: 'code_test',    label: 'Code Test',       color: 'bg-orange-900/40 text-orange-300' },
  { value: 'interview_1',  label: 'Interview 1',     color: 'bg-purple-900/40 text-purple-300' },
  { value: 'interview_2',  label: 'Interview 2',     color: 'bg-violet-900/40 text-violet-300' },
  { value: 'interview_3',  label: 'Interview 3',     color: 'bg-fuchsia-900/40 text-fuchsia-300' },
  { value: 'offer',        label: 'Offer',           color: 'bg-emerald-900/40 text-emerald-300' },
  { value: 'accepted',     label: 'Accepted',        color: 'bg-green-900/40 text-green-300' },
  { value: 'rejected',     label: 'Rejected',        color: 'bg-red-900/40 text-red-300' },
  { value: 'withdrawn',    label: 'Withdrawn',       color: 'bg-zinc-700 text-zinc-400' },
]

const badge = status => {
  const s = STATUSES.find(s => s.value === status) || STATUSES[0]
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
}

const fmt = n => n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—'

function NewJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ company: '', role: '', jd: '', maxBudget: '', askedBudget: '', location: '', jobUrl: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/jobs', { ...form, maxBudget: form.maxBudget || undefined, askedBudget: form.askedBudget || undefined })
      onCreated(data)
      onClose()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/60">
          <h2 className="text-lg font-bold text-zinc-50">New Application</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Company *</label>
              <input value={form.company} onChange={set('company')} required className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Role *</label>
              <input value={form.role} onChange={set('role')} required className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Max Budget (INR)</label>
              <input type="number" value={form.maxBudget} onChange={set('maxBudget')} className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">My Asked Budget (INR)</label>
              <input type="number" value={form.askedBudget} onChange={set('askedBudget')} className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Location</label>
              <input value={form.location} onChange={set('location')} className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Job URL</label>
              <input type="url" value={form.jobUrl} onChange={set('jobUrl')} className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Job Description *</label>
            <textarea value={form.jd} onChange={set('jd')} required rows={6} className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Notes / Queries</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function JobDetail({ app, onClose, onUpdate }) {
  const [status, setStatus] = useState(app.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const [tailored, setTailored] = useState(parseTailored(app.tailoredCV))
  const [downloading, setDownloading] = useState(false)

  const updateStatus = async () => {
    if (status === app.status && !note) return
    setSaving(true)
    try {
      const { data } = await api.patch(`/jobs/${app._id}/status`, { status, note })
      onUpdate(data)
      setNote('')
    } finally { setSaving(false) }
  }

  const tailorCV = async () => {
    setTailoring(true)
    try {
      const { data } = await api.post('/cv/tailor', { jd: app.jd })
      setTailored(data.tailored)
      await api.put(`/jobs/${app._id}`, { tailoredCV: JSON.stringify(data.tailored) })
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
    finally { setTailoring(false) }
  }

  const syncGmail = async () => {
    setSyncing(true)
    try { await api.post('/gmail/sync') } catch (e) { alert(e.response?.data?.message || 'Gmail sync failed') }
    finally { setSyncing(false) }
  }

  const downloadCV = async () => {
    if (!tailored) return
    setDownloading(true)
    try {
      await downloadResumePdf({ resume: tailored, company: app.company, role: app.role })
    } catch { alert('PDF download failed') }
    finally { setDownloading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/60">
          <div>
            <h2 className="text-lg font-bold text-zinc-50">{app.role}</h2>
            <p className="text-sm text-zinc-400 flex items-center gap-1"><Building2 size={13} /> {app.company} {app.location ? `· ${app.location}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Budget */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950 rounded-xl p-4">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Max Budget</p>
              <p className="font-semibold text-zinc-50">{fmt(app.maxBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">My Asked Budget</p>
              <p className="font-semibold text-zinc-50">{fmt(app.askedBudget)}</p>
            </div>
            {app.jobUrl && (
              <div className="col-span-2">
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline truncate block">{app.jobUrl}</a>
              </div>
            )}
          </div>

          {/* Status update */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${status === s.value ? 'ring-2 ring-blue-500 ' + s.color : 'border-zinc-700/60 text-zinc-300 hover:bg-zinc-950'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note…"
                className="flex-1 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={updateStatus} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />} Save
              </button>
              <button onClick={syncGmail} disabled={syncing} title="Sync Gmail"
                className="px-3 py-2 border border-zinc-700/60 rounded-xl hover:bg-zinc-950 text-zinc-300 disabled:opacity-60">
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Status history */}
          {app.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">History</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {[...app.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {badge(h.status)}
                    {h.note && <span className="text-zinc-400 text-xs">{h.note}</span>}
                    <span className="text-zinc-500 text-xs ml-auto">{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CV tailoring */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Tailored CV</p>
              <div className="flex gap-2">
                <button onClick={tailorCV} disabled={tailoring} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium disabled:opacity-60">
                  {tailoring ? <Loader2 size={12} className="animate-spin" /> : '✨'} {tailored ? 'Re-tailor' : 'Tailor CV for this JD'}
                </button>
                {tailored && (
                  <button onClick={downloadCV} disabled={downloading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium disabled:opacity-60">
                    {downloading ? <Loader2 size={12} className="animate-spin" /> : '↓'} Download PDF
                  </button>
                )}
              </div>
            </div>
            {tailored && (
              <div className="bg-zinc-950 rounded-xl p-3 text-xs text-zinc-200 space-y-2 max-h-60 overflow-auto">
                <p className="font-semibold">{tailored.header?.name}</p>
                {tailored.summary?.[0] && <p>{tailored.summary[0]}</p>}
                {tailored.experience?.[0] && (
                  <p className="text-zinc-400">{tailored.experience[0].role} @ {tailored.experience[0].company}</p>
                )}
              </div>
            )}
          </div>

          {/* JD */}
          <details className="group">
            <summary className="text-xs font-semibold text-zinc-300 uppercase tracking-wider cursor-pointer select-none">Job Description</summary>
            <pre className="mt-2 bg-zinc-950 rounded-xl p-3 text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-auto">{app.jd}</pre>
          </details>

          {/* Notes */}
          {app.notes && (
            <div>
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-zinc-200 bg-zinc-950 rounded-xl p-3">{app.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const fmtSyncResult = data => {
  if (!data) return 'Sync failed'
  const parts = [
    `${data.invitesFound ?? 0} invite(s) found`,
    `${data.statusUpdates ?? 0} status update(s)`,
    `${data.newApplications ?? 0} new application(s)`,
  ]
  return `Inbox scanned. ${parts.join(', ')}.`
}

export default function JobTracker() {
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  const load = () => api.get('/jobs').then(r => setApps(r.data))

  const syncAll = async (silent = false) => {
    setSyncing(true)
    try {
      const { data } = await api.post('/gmail/sync')
      setLastSync(new Date())
      if (!silent) alert(fmtSyncResult(data))
      await load()
      return data
    } catch (e) {
      if (!silent) alert(e.response?.data?.message || 'Sync failed')
      return null
    } finally { setSyncing(false) }
  }

  useEffect(() => {
    load()
    api.get('/gmail/status').then(async r => {
      if (!r.data.connected) return
      const last = r.data.lastSyncAt ? new Date(r.data.lastSyncAt).getTime() : 0
      if (Date.now() - last > 15 * 60 * 1000) syncAll(true)
    }).catch(() => {})
    socket.on('job:created', a => setApps(p => [a, ...p]))
    socket.on('job:updated', a => setApps(p => p.map(x => x._id === a._id ? a : x)))
    socket.on('job:deleted', ({ id }) => setApps(p => p.filter(x => x._id !== id)))
    return () => { socket.off('job:created'); socket.off('job:updated'); socket.off('job:deleted') }
  }, [])

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Job Tracker</h1>
        <div className="flex gap-2">
          <button onClick={() => syncAll()} disabled={syncing} className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 rounded-xl text-sm text-zinc-300 hover:bg-zinc-950 disabled:opacity-60">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Scanning inbox…' : 'Sync Gmail'}
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus size={16} /> New Application
          </button>
        </div>
      </div>

      {lastSync && (
        <p className="text-xs text-zinc-500 mb-4">Last inbox scan: {lastSync.toLocaleString()}</p>
      )}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filter === 'all' ? 'bg-zinc-700 text-zinc-50' : 'border border-zinc-700/60 text-zinc-300 hover:bg-zinc-950'}`}>All ({apps.length})</button>
        {STATUSES.map(s => {
          const count = apps.filter(a => a.status === s.value).length
          if (count === 0) return null
          return (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filter === s.value ? s.color + ' ring-2 ring-blue-500/50' : 'border border-zinc-700/60 text-zinc-300 hover:bg-zinc-950'}`}>
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p>No applications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => (
            <button key={app._id} onClick={() => setSelected(app)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-blue-800 transition text-left">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-50 truncate">{app.role}</p>
                <p className="text-sm text-zinc-400">{app.company} {app.location ? `· ${app.location}` : ''}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {app.askedBudget && <span className="text-xs text-zinc-400 hidden sm:block">{fmt(app.askedBudget)}</span>}
                {badge(app.status)}
                <ChevronRight size={16} className="text-zinc-500" />
              </div>
            </button>
          ))}
        </div>
      )}

      {showNew && <NewJobModal onClose={() => setShowNew(false)} onCreated={a => setApps(p => [a, ...p])} />}
      {selected && <JobDetail app={selected} onClose={() => setSelected(null)} onUpdate={a => { setApps(p => p.map(x => x._id === a._id ? a : x)); setSelected(a) }} />}
    </div>
  )
}
