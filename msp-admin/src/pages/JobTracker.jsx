import { useEffect, useState, useRef } from 'react'
import {
  Plus, ChevronRight, Building2, RefreshCw, Loader2, X, Briefcase,
  LayoutList, Columns, Download, Bell, Calendar, AlertTriangle,
} from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'
import { downloadResumePdf } from '../lib/resumePdf'

const parseTailored = raw => {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try { return JSON.parse(raw) } catch { return null }
}

export const STATUSES = [
  { value: 'draft',        label: 'Draft',        color: 'bg-zinc-800 text-zinc-300',           border: 'border-zinc-600' },
  { value: 'applied',      label: 'Applied',      color: 'bg-blue-900/40 text-blue-300',         border: 'border-blue-600' },
  { value: 'responded',    label: 'Responded',    color: 'bg-cyan-900/40 text-cyan-300',         border: 'border-cyan-600' },
  { value: 'phone_screen', label: 'Phone Screen', color: 'bg-yellow-900/40 text-yellow-300',     border: 'border-yellow-600' },
  { value: 'code_test',    label: 'Code Test',    color: 'bg-orange-900/40 text-orange-300',     border: 'border-orange-600' },
  { value: 'interview_1',  label: 'Interview 1',  color: 'bg-purple-900/40 text-purple-300',     border: 'border-purple-600' },
  { value: 'interview_2',  label: 'Interview 2',  color: 'bg-violet-900/40 text-violet-300',     border: 'border-violet-600' },
  { value: 'interview_3',  label: 'Interview 3',  color: 'bg-fuchsia-900/40 text-fuchsia-300',   border: 'border-fuchsia-600' },
  { value: 'offer',        label: 'Offer',        color: 'bg-emerald-900/40 text-emerald-300',   border: 'border-emerald-500' },
  { value: 'accepted',     label: 'Accepted',     color: 'bg-green-900/40 text-green-300',       border: 'border-green-500' },
  { value: 'rejected',     label: 'Rejected',     color: 'bg-red-900/40 text-red-300',           border: 'border-red-700' },
  { value: 'withdrawn',    label: 'Withdrawn',    color: 'bg-zinc-700 text-zinc-400',            border: 'border-zinc-600' },
]

const KANBAN_COLS = [
  { id: 'draft',     label: 'Draft',        statuses: ['draft'],                            headerColor: 'bg-zinc-700' },
  { id: 'applied',   label: 'Applied',      statuses: ['applied', 'responded'],             headerColor: 'bg-blue-700' },
  { id: 'screening', label: 'Screening',    statuses: ['phone_screen', 'code_test'],        headerColor: 'bg-yellow-700' },
  { id: 'interview', label: 'Interview',    statuses: ['interview_1','interview_2','interview_3'], headerColor: 'bg-purple-700' },
  { id: 'offer',     label: 'Offer',        statuses: ['offer', 'accepted'],                headerColor: 'bg-emerald-700' },
  { id: 'closed',    label: 'Closed',       statuses: ['rejected', 'withdrawn'],            headerColor: 'bg-red-800' },
]

const badge = status => {
  const s = STATUSES.find(s => s.value === status) || STATUSES[0]
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
}

const fmt = n => n ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—'

const daysAgo = date => date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : null

const needsFollowUp = app => {
  if (app.status !== 'applied' || !app.appliedAt) return false
  return daysAgo(app.appliedAt) >= 7
}

// ── Shared input style ────────────────────────────────────────────────────────
const inp = 'w-full bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-500'

// ── New Job Modal ─────────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/60">
          <h2 className="text-lg font-bold text-zinc-50">New Application</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-zinc-300 mb-1">Company *</label>
              <input value={form.company} onChange={set('company')} required className={inp} /></div>
            <div><label className="block text-xs font-medium text-zinc-300 mb-1">Role *</label>
              <input value={form.role} onChange={set('role')} required className={inp} /></div>
            <div><label className="block text-xs font-medium text-zinc-300 mb-1">Max Budget (INR)</label>
              <input type="number" value={form.maxBudget} onChange={set('maxBudget')} className={inp} /></div>
            <div><label className="block text-xs font-medium text-zinc-300 mb-1">My Asked Budget (INR)</label>
              <input type="number" value={form.askedBudget} onChange={set('askedBudget')} className={inp} /></div>
            <div><label className="block text-xs font-medium text-zinc-300 mb-1">Location</label>
              <input value={form.location} onChange={set('location')} className={inp} /></div>
            <div><label className="block text-xs font-medium text-zinc-300 mb-1">Job URL</label>
              <input type="url" value={form.jobUrl} onChange={set('jobUrl')} className={inp} /></div>
          </div>
          <div><label className="block text-xs font-medium text-zinc-300 mb-1">Job Description *</label>
            <textarea value={form.jd} onChange={set('jd')} required rows={6} className={`${inp} resize-none font-mono`} /></div>
          <div><label className="block text-xs font-medium text-zinc-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inp} resize-none`} /></div>
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

// ── Job Detail Modal ──────────────────────────────────────────────────────────
function JobDetail({ app, onClose, onUpdate }) {
  const [status, setStatus] = useState(app.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const [tailored, setTailored] = useState(parseTailored(app.tailoredCV))
  const [downloading, setDownloading] = useState(false)
  const [editNotes, setEditNotes] = useState(app.notes ?? '')
  const [editingNotes, setEditingNotes] = useState(false)
  const [rejectionReason, setRejectionReason] = useState(app.rejectionReason ?? '')
  const [interviewDate, setInterviewDate] = useState(
    app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 16) : ''
  )
  const [followUpAt, setFollowUpAt] = useState(
    app.followUpAt ? new Date(app.followUpAt).toISOString().slice(0, 10) : ''
  )

  const updateStatus = async () => {
    if (status === app.status && !note) return
    setSaving(true)
    try {
      const extra = {}
      if (status === 'rejected' && rejectionReason) extra.rejectionReason = rejectionReason
      if (interviewDate) extra.interviewDate = new Date(interviewDate)
      if (followUpAt) extra.followUpAt = new Date(followUpAt)
      const { data } = await api.patch(`/jobs/${app._id}/status`, { status, note })
      if (Object.keys(extra).length) await api.put(`/jobs/${app._id}`, extra)
      onUpdate({ ...data, ...extra })
      setNote('')
    } finally { setSaving(false) }
  }

  const saveNotes = async () => {
    const { data } = await api.put(`/jobs/${app._id}`, { notes: editNotes })
    onUpdate(data)
    setEditingNotes(false)
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

  const downloadCV = async () => {
    if (!tailored) return
    setDownloading(true)
    try { await downloadResumePdf({ resume: tailored, company: app.company, role: app.role }) }
    catch { alert('PDF download failed') }
    finally { setDownloading(false) }
  }

  const days = daysAgo(app.appliedAt)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/60">
          <div>
            <h2 className="text-lg font-bold text-zinc-50">{app.role}</h2>
            <p className="text-sm text-zinc-400 flex items-center gap-1">
              <Building2 size={13} /> {app.company}{app.location ? ` · ${app.location}` : ''}
              {days !== null && <span className="ml-2 text-zinc-500">· Applied {days}d ago</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Follow-up warning */}
          {needsFollowUp(app) && (
            <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-300">
              <AlertTriangle size={15} /> Applied {days} days ago with no response — consider following up.
            </div>
          )}

          {/* Budget + URL */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950 rounded-xl p-4">
            <div><p className="text-xs text-zinc-400 mb-1">Max Budget</p><p className="font-semibold text-zinc-50">{fmt(app.maxBudget)}</p></div>
            <div><p className="text-xs text-zinc-400 mb-1">My Asked Budget</p><p className="font-semibold text-zinc-50">{fmt(app.askedBudget)}</p></div>
            {app.jobUrl && (
              <div className="col-span-2">
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline truncate block">{app.jobUrl}</a>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1 flex items-center gap-1"><Calendar size={11} /> Interview Date</label>
              <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                className={inp} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1 flex items-center gap-1"><Bell size={11} /> Follow-up Date</label>
              <input type="date" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)}
                className={inp} />
            </div>
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

            {status === 'rejected' && (
              <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="Rejection reason (optional)…" className={inp} />
            )}

            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note…" className={`${inp} flex-1`} />
              <button onClick={updateStatus} disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />} Save
              </button>
            </div>
          </div>

          {/* History */}
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

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Notes</p>
              {!editingNotes
                ? <button onClick={() => setEditingNotes(true)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                : <div className="flex gap-2">
                    <button onClick={saveNotes} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                    <button onClick={() => { setEditNotes(app.notes ?? ''); setEditingNotes(false) }} className="text-xs text-zinc-500">Cancel</button>
                  </div>
              }
            </div>
            {editingNotes
              ? <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4} className={`${inp} resize-none`} />
              : <p className="text-sm text-zinc-300 bg-zinc-950 rounded-xl p-3 min-h-[2.5rem] whitespace-pre-wrap">{editNotes || <span className="text-zinc-600">No notes yet</span>}</p>
            }
          </div>

          {/* CV tailoring */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Tailored CV</p>
              <div className="flex gap-2">
                <button onClick={tailorCV} disabled={tailoring}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium disabled:opacity-60">
                  {tailoring ? <Loader2 size={12} className="animate-spin" /> : '✨'} {tailored ? 'Re-tailor' : 'Tailor for this JD'}
                </button>
                {tailored && (
                  <button onClick={downloadCV} disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium disabled:opacity-60">
                    {downloading ? <Loader2 size={12} className="animate-spin" /> : '↓'} PDF
                  </button>
                )}
              </div>
            </div>
            {tailored && (
              <div className="bg-zinc-950 rounded-xl p-3 text-xs text-zinc-200 space-y-1 max-h-36 overflow-auto">
                <p className="font-semibold">{tailored.header?.name}</p>
                {tailored.summary?.[0] && <p className="text-zinc-400">{tailored.summary[0]}</p>}
              </div>
            )}
          </div>

          {/* JD */}
          <details className="group">
            <summary className="text-xs font-semibold text-zinc-300 uppercase tracking-wider cursor-pointer select-none">Job Description</summary>
            <pre className="mt-2 bg-zinc-950 rounded-xl p-3 text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-auto">{app.jd}</pre>
          </details>
        </div>
      </div>
    </div>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────
function KanbanCard({ app, onClick, onDragStart }) {
  const followUp = needsFollowUp(app)
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('appId', app._id); onDragStart(app._id) }}
      onClick={() => onClick(app)}
      className="bg-zinc-800 rounded-xl p-3 border border-zinc-700/60 hover:border-blue-600/50 cursor-pointer transition select-none"
    >
      <p className="font-medium text-zinc-100 text-sm leading-snug truncate">{app.role}</p>
      <p className="text-xs text-zinc-400 mt-0.5 truncate">{app.company}</p>
      {app.location && <p className="text-xs text-zinc-600 truncate">{app.location}</p>}
      <div className="flex items-center justify-between mt-2">
        {app.askedBudget && <span className="text-xs text-zinc-500">{fmt(app.askedBudget)}</span>}
        {followUp && <AlertTriangle size={13} className="text-amber-400" title="Follow-up needed" />}
      </div>
    </div>
  )
}

// ── Kanban Board ──────────────────────────────────────────────────────────────
function KanbanBoard({ apps, onCardClick, onStatusChange }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const handleDrop = async (e, col) => {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId')
    const targetStatus = col.statuses[0]
    const app = apps.find(a => a._id === appId)
    if (!app || app.status === targetStatus) { setDragOver(null); return }
    await onStatusChange(appId, targetStatus)
    setDragOver(null)
    setDragging(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
      {KANBAN_COLS.map(col => {
        const colApps = apps.filter(a => col.statuses.includes(a.status))
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-56 rounded-2xl border transition ${dragOver === col.id ? 'border-blue-500 bg-blue-950/10' : 'border-zinc-700/60 bg-zinc-900/40'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, col)}
          >
            <div className={`${col.headerColor} rounded-t-2xl px-3 py-2 flex items-center justify-between`}>
              <span className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</span>
              <span className="text-xs font-bold text-white/70 bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">{colApps.length}</span>
            </div>
            <div className="p-2 space-y-2">
              {colApps.map(app => (
                <KanbanCard key={app._id} app={app} onClick={onCardClick} onDragStart={setDragging} />
              ))}
              {colApps.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">Empty</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/jobs/analytics').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-2xl p-8 flex items-center gap-3 text-zinc-300">
        <Loader2 size={20} className="animate-spin" /> Loading analytics…
      </div>
    </div>
  )

  const statusLabels = {
    draft: 'Draft', applied: 'Applied', responded: 'Responded',
    phone_screen: 'Phone Screen', code_test: 'Code Test',
    interview_1: 'Interview 1', interview_2: 'Interview 2', interview_3: 'Interview 3',
    offer: 'Offer', accepted: 'Accepted', rejected: 'Rejected', withdrawn: 'Withdrawn',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/60">
          <h2 className="text-lg font-bold text-zinc-50">Application Analytics</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: data?.total ?? 0, color: 'text-zinc-50' },
              { label: 'Active', value: data?.activeCount ?? 0, color: 'text-blue-400' },
              { label: 'Response Rate', value: `${data?.responseRate ?? 0}%`, color: 'text-emerald-400' },
              { label: 'Offers', value: data?.offersCount ?? 0, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-800 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-zinc-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {data?.avgDaysToResponse != null && (
            <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">⏱</span>
              <div>
                <p className="text-zinc-50 font-semibold">{data.avgDaysToResponse} days</p>
                <p className="text-xs text-zinc-400">average time to first response</p>
              </div>
            </div>
          )}

          {data?.followUpNeeded > 0 && (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300"><strong>{data.followUpNeeded}</strong> application{data.followUpNeeded !== 1 ? 's' : ''} pending follow-up (applied 7+ days ago)</p>
            </div>
          )}

          {/* Weekly activity */}
          {data?.weeklyData && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Weekly Activity (last 8 weeks)</p>
              <div className="flex items-end gap-1.5 h-24">
                {data.weeklyData.map((w, i) => {
                  const max = Math.max(...data.weeklyData.map(x => x.count), 1)
                  const h = Math.round((w.count / max) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-500">{w.count || ''}</span>
                      <div className="w-full bg-blue-600/80 rounded-t-sm transition-all" style={{ height: `${h}%`, minHeight: w.count ? 4 : 0 }} />
                      <span className="text-[10px] text-zinc-600 truncate w-full text-center">{w.week}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status breakdown */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Pipeline Breakdown</p>
            <div className="space-y-2">
              {Object.entries(data?.byStatus ?? {}).filter(([,v]) => v > 0).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-28 shrink-0">{statusLabels[status] ?? status}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.round((count / data.total) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium text-zinc-300 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rejection reasons */}
          {data?.rejectionReasons?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Rejection Reasons</p>
              <div className="space-y-1.5">
                {data.rejectionReasons.map((r, i) => (
                  <div key={i} className="bg-red-900/10 border border-red-800/30 rounded-xl px-3 py-2 text-xs text-red-300">{r}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function JobTracker() {
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list') // 'list' | 'kanban'
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = () => api.get('/jobs').then(r => setApps(r.data))

  const syncAll = async (silent = false) => {
    setSyncing(true)
    try {
      await api.post('/gmail/sync')
      await load()
    } catch (e) {
      if (!silent) alert(e.response?.data?.message || 'Sync failed')
    } finally { setSyncing(false) }
  }

  const handleStatusChange = async (appId, status) => {
    try {
      const { data } = await api.patch(`/jobs/${appId}/status`, { status })
      setApps(p => p.map(x => x._id === appId ? data : x))
    } catch { alert('Status update failed') }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const response = await api.get('/jobs/export', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      const d = response.headers?.['content-disposition']
      a.download = d?.match(/filename="([^"]+)"/)?.[1] ?? 'JobApplications.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed') }
    finally { setExporting(false) }
  }

  useEffect(() => {
    load()
    socket.on('job:created', a => setApps(p => [a, ...p]))
    socket.on('job:updated', a => setApps(p => p.map(x => x._id === a._id ? a : x)))
    socket.on('job:deleted', ({ id }) => setApps(p => p.filter(x => x._id !== id)))
    return () => { socket.off('job:created'); socket.off('job:updated'); socket.off('job:deleted') }
  }, [])

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)
  const followUpCount = apps.filter(needsFollowUp).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-50">Job Tracker</h1>
          {followUpCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs font-medium px-2.5 py-1 rounded-full">
              <AlertTriangle size={11} /> {followUpCount} follow-up{followUpCount !== 1 ? 's' : ''} needed
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex border border-zinc-700/60 rounded-xl overflow-hidden">
            <button onClick={() => setView('list')} title="List view"
              className={`p-2 transition ${view === 'list' ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setView('kanban')} title="Kanban view"
              className={`p-2 transition ${view === 'kanban' ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-800'}`}>
              <Columns size={16} />
            </button>
          </div>
          <button onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-700/60 rounded-xl text-sm text-zinc-300 hover:bg-zinc-950">
            📊 Analytics
          </button>
          <button onClick={exportCsv} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 border border-zinc-700/60 rounded-xl text-sm text-zinc-300 hover:bg-zinc-950 disabled:opacity-60">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export
          </button>
          <button onClick={() => syncAll()} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 rounded-xl text-sm text-zinc-300 hover:bg-zinc-950 disabled:opacity-60">
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Gmail'}
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' ? (
        <KanbanBoard apps={apps} onCardClick={a => setSelected(a)} onStatusChange={handleStatusChange} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-5">
            <button onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filter === 'all' ? 'bg-zinc-700 text-zinc-50' : 'border border-zinc-700/60 text-zinc-300 hover:bg-zinc-950'}`}>
              All ({apps.length})
            </button>
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
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-50 truncate">{app.role}</p>
                    <p className="text-sm text-zinc-400">{app.company}{app.location ? ` · ${app.location}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {needsFollowUp(app) && <AlertTriangle size={14} className="text-amber-400" />}
                    {app.askedBudget && <span className="text-xs text-zinc-400 hidden sm:block">{fmt(app.askedBudget)}</span>}
                    {badge(app.status)}
                    <ChevronRight size={16} className="text-zinc-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showNew && <NewJobModal onClose={() => setShowNew(false)} onCreated={a => setApps(p => [a, ...p])} />}
      {selected && (
        <JobDetail
          app={selected}
          onClose={() => setSelected(null)}
          onUpdate={a => { setApps(p => p.map(x => x._id === a._id ? a : x)); setSelected(a) }}
        />
      )}
      {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}
    </div>
  )
}
