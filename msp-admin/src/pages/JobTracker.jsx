import { useEffect, useState, useCallback } from 'react'
import {
  Plus, ChevronRight, Building2, RefreshCw, Loader2, X, Briefcase,
  LayoutList, Columns, Download, Bell, Calendar, AlertTriangle, MapPin,
  Clock, BarChart2, ExternalLink,
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
  { value: 'draft',        label: 'Draft',        dim: true  },
  { value: 'applied',      label: 'Applied',      dim: false },
  { value: 'responded',    label: 'Responded',    dim: false },
  { value: 'phone_screen', label: 'Phone Screen', dim: false },
  { value: 'code_test',    label: 'Code Test',    dim: false },
  { value: 'interview_1',  label: 'Interview 1',  dim: false },
  { value: 'interview_2',  label: 'Interview 2',  dim: false },
  { value: 'interview_3',  label: 'Interview 3',  dim: false },
  { value: 'offer',        label: 'Offer',        dim: false },
  { value: 'accepted',     label: 'Accepted',     dim: false },
  { value: 'rejected',     label: 'Rejected',     dim: true  },
  { value: 'withdrawn',    label: 'Withdrawn',    dim: true  },
]

const STAGE_ORDER = ['draft','applied','responded','phone_screen','code_test','interview_1','interview_2','interview_3','offer','accepted','rejected','withdrawn']
const stageIndex = s => STAGE_ORDER.indexOf(s)

const StatusBadge = ({ status, size = 'sm' }) => {
  const s = STATUSES.find(x => x.value === status) ?? STATUSES[0]
  const base = size === 'xs'
    ? 'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border'
    : 'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border'
  const style = s.dim
    ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
    : stageIndex(status) >= stageIndex('offer')
      ? 'bg-zinc-700 text-zinc-100 border-zinc-600 font-semibold'
      : stageIndex(status) >= stageIndex('interview_1')
        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
  return <span className={`${base} ${style}`}>{s.label}</span>
}

const KANBAN_COLS = [
  { id: 'draft',     label: 'Draft',     statuses: ['draft'] },
  { id: 'applied',   label: 'Applied',   statuses: ['applied', 'responded'] },
  { id: 'screening', label: 'Screening', statuses: ['phone_screen', 'code_test'] },
  { id: 'interview', label: 'Interview', statuses: ['interview_1','interview_2','interview_3'] },
  { id: 'offer',     label: 'Offer',     statuses: ['offer', 'accepted'] },
  { id: 'closed',    label: 'Closed',    statuses: ['rejected', 'withdrawn'] },
]

const fmt = n => n
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  : null

const daysAgo = date => date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : null
const needsFollowUp = app => app.status === 'applied' && app.appliedAt && daysAgo(app.appliedAt) >= 7

const inp = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder-zinc-600'
const btn = {
  primary: 'flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-sm font-medium border border-zinc-600 transition disabled:opacity-40',
  ghost:   'flex items-center gap-2 px-4 py-2 border border-zinc-800 text-zinc-400 rounded-xl text-sm hover:bg-zinc-900 hover:text-zinc-200 transition disabled:opacity-40',
  sm:      'flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-800 hover:border-zinc-700 transition disabled:opacity-40',
}

function NewJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ company: '', role: '', jd: '', maxBudget: '', askedBudget: '', location: '', jobUrl: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const submit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post('/jobs', { ...form, maxBudget: form.maxBudget || undefined, askedBudget: form.askedBudget || undefined })
      onCreated(data); onClose()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">New Application</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className="text-xs text-zinc-600">Company *</label><input value={form.company} onChange={set('company')} required className={inp} /></div>
            <div className="space-y-1"><label className="text-xs text-zinc-600">Role *</label><input value={form.role} onChange={set('role')} required className={inp} /></div>
            <div className="space-y-1"><label className="text-xs text-zinc-600">Max Budget (INR)</label><input type="number" value={form.maxBudget} onChange={set('maxBudget')} className={inp} /></div>
            <div className="space-y-1"><label className="text-xs text-zinc-600">My Ask (INR)</label><input type="number" value={form.askedBudget} onChange={set('askedBudget')} className={inp} /></div>
            <div className="space-y-1"><label className="text-xs text-zinc-600">Location</label><input value={form.location} onChange={set('location')} className={inp} /></div>
            <div className="space-y-1"><label className="text-xs text-zinc-600">Job URL</label><input type="url" value={form.jobUrl} onChange={set('jobUrl')} className={inp} /></div>
          </div>
          <div className="space-y-1"><label className="text-xs text-zinc-600">Job Description *</label>
            <textarea value={form.jd} onChange={set('jd')} required rows={6} className={`${inp} resize-none font-mono`} /></div>
          <div className="space-y-1"><label className="text-xs text-zinc-600">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inp} resize-none`} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={btn.ghost}>Cancel</button>
            <button type="submit" disabled={loading} className={btn.primary}>
              {loading && <Loader2 size={13} className="animate-spin" />} Save
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
  const [tailoring, setTailoring] = useState(false)
  const [tailored, setTailored] = useState(parseTailored(app.tailoredCV))
  const [downloading, setDownloading] = useState(false)
  const [editNotes, setEditNotes] = useState(app.notes ?? '')
  const [editingNotes, setEditingNotes] = useState(false)
  const [rejectionReason, setRejectionReason] = useState(app.rejectionReason ?? '')
  const [interviewDate, setInterviewDate] = useState(app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0,16) : '')
  const [followUpAt, setFollowUpAt] = useState(app.followUpAt ? new Date(app.followUpAt).toISOString().slice(0,10) : '')

  const updateStatus = async () => {
    setSaving(true)
    try {
      const extra = {}
      if (status === 'rejected' && rejectionReason) extra.rejectionReason = rejectionReason
      if (interviewDate) extra.interviewDate = new Date(interviewDate)
      if (followUpAt) extra.followUpAt = new Date(followUpAt)
      const { data } = await api.patch(`/jobs/${app._id}/status`, { status, note })
      if (Object.keys(extra).length) await api.put(`/jobs/${app._id}`, extra)
      onUpdate({ ...data, ...extra }); setNote('')
    } finally { setSaving(false) }
  }

  const saveNotes = async () => {
    const { data } = await api.put(`/jobs/${app._id}`, { notes: editNotes })
    onUpdate(data); setEditingNotes(false)
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{app.role}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Building2 size={11}/>{app.company}</span>
              {app.location && <span className="flex items-center gap-1"><MapPin size={11}/>{app.location}</span>}
              {days !== null && <span><Clock size={11} className="inline mr-0.5"/>{days}d ago</span>}
              <StatusBadge status={app.status} size="xs" />
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 mt-0.5"><X size={16}/></button>
        </div>

        <div className="p-6 space-y-5">
          {needsFollowUp(app) && (
            <div className="flex items-center gap-2 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-400 bg-zinc-900">
              <AlertTriangle size={13} className="shrink-0"/> Applied {days} days ago with no response — consider following up.
            </div>
          )}

          {/* Key info */}
          {(app.maxBudget || app.askedBudget || app.jobUrl) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-2 gap-3">
              {app.maxBudget && <div><p className="text-xs text-zinc-600 mb-0.5">Max Budget</p><p className="text-sm font-medium text-zinc-200">{fmt(app.maxBudget)}</p></div>}
              {app.askedBudget && <div><p className="text-xs text-zinc-600 mb-0.5">My Ask</p><p className="text-sm font-medium text-zinc-200">{fmt(app.askedBudget)}</p></div>}
              {app.jobUrl && <div className="col-span-2">
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition truncate">
                  <ExternalLink size={10}/>{app.jobUrl}
                </a>
              </div>}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-600 flex items-center gap-1"><Calendar size={10}/> Interview Date</label>
              <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className={inp}/>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-600 flex items-center gap-1"><Bell size={10}/> Follow-up On</label>
              <input type="date" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} className={inp}/>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Update Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    status === s.value
                      ? 'bg-zinc-200 text-zinc-900 border-zinc-200'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}>{s.label}</button>
              ))}
            </div>
            {status === 'rejected' && (
              <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="Rejection reason (optional)…" className={inp}/>
            )}
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)…" className={`${inp} flex-1`}/>
              <button onClick={updateStatus} disabled={saving} className={btn.primary}>
                {saving && <Loader2 size={13} className="animate-spin"/>} Save
              </button>
            </div>
          </div>

          {/* History */}
          {app.statusHistory?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">History</p>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {[...app.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <StatusBadge status={h.status} size="xs"/>
                    {h.note && <span className="text-zinc-600">{h.note}</span>}
                    <span className="text-zinc-700 ml-auto">{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Notes</p>
              {!editingNotes
                ? <button onClick={() => setEditingNotes(true)} className="text-xs text-zinc-600 hover:text-zinc-300">Edit</button>
                : <div className="flex gap-3">
                    <button onClick={saveNotes} className="text-xs text-zinc-300">Save</button>
                    <button onClick={() => { setEditNotes(app.notes ?? ''); setEditingNotes(false) }} className="text-xs text-zinc-600">Cancel</button>
                  </div>
              }
            </div>
            {editingNotes
              ? <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4} className={`${inp} resize-none`}/>
              : <p className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl p-3 min-h-[2.5rem] whitespace-pre-wrap leading-relaxed">
                  {editNotes || <span className="text-zinc-700">No notes</span>}
                </p>
            }
          </div>

          {/* CV tailor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Tailored CV</p>
              <div className="flex gap-2">
                <button onClick={tailorCV} disabled={tailoring} className={btn.sm}>
                  {tailoring ? <Loader2 size={11} className="animate-spin"/> : '✦'} {tailored ? 'Re-tailor' : 'Tailor for this role'}
                </button>
                {tailored && <button onClick={downloadCV} disabled={downloading} className={btn.sm}>
                  {downloading ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>} PDF
                </button>}
              </div>
            </div>
            {tailored && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-500 max-h-28 overflow-auto">
                <p className="font-semibold text-zinc-200 mb-1">{tailored.header?.name}</p>
                {tailored.summary?.[0] && <p className="leading-relaxed">{tailored.summary[0]}</p>}
              </div>
            )}
          </div>

          {/* JD */}
          <details className="group">
            <summary className="text-xs text-zinc-600 uppercase tracking-wider font-medium cursor-pointer select-none list-none flex items-center gap-1 hover:text-zinc-400">
              <ChevronRight size={11} className="group-open:rotate-90 transition-transform"/> Job Description
            </summary>
            <pre className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-500 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-auto">{app.jd}</pre>
          </details>
        </div>
      </div>
    </div>
  )
}

function KanbanCard({ app, onClick, onDragStart }) {
  const days = daysAgo(app.appliedAt)
  return (
    <div draggable onDragStart={e => { e.dataTransfer.setData('appId', app._id); onDragStart(app._id) }}
      onClick={() => onClick(app)}
      className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 cursor-pointer transition select-none">
      <p className="text-xs font-medium text-zinc-100 leading-snug truncate">{app.role}</p>
      <p className="text-xs text-zinc-500 mt-0.5 truncate">{app.company}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900">
        <span className="text-[10px] text-zinc-700">{days !== null ? `${days}d` : ''}</span>
        <div className="flex items-center gap-1">
          {needsFollowUp(app) && <AlertTriangle size={10} className="text-zinc-600"/>}
          {app.askedBudget && <span className="text-[10px] text-zinc-700">{fmt(app.askedBudget)}</span>}
        </div>
      </div>
    </div>
  )
}

function KanbanBoard({ apps, onCardClick, onStatusChange }) {
  const [dragOver, setDragOver] = useState(null)
  const handleDrop = async (e, col) => {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId')
    const app = apps.find(a => a._id === appId)
    if (!app || app.status === col.statuses[0]) { setDragOver(null); return }
    await onStatusChange(appId, col.statuses[0])
    setDragOver(null)
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_COLS.map(col => {
        const colApps = apps.filter(a => col.statuses.includes(a.status))
        const isOver = dragOver === col.id
        return (
          <div key={col.id}
            className={`flex-shrink-0 w-52 rounded-2xl border transition ${isOver ? 'border-zinc-600' : 'border-zinc-800'} bg-zinc-900/30`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, col)}>
            <div className="px-3 py-2.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{col.label}</span>
              <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded-full w-5 h-5 flex items-center justify-center">{colApps.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-20">
              {colApps.map(app => <KanbanCard key={app._id} app={app} onClick={onCardClick} onDragStart={() => {}} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AnalyticsPanel({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/jobs/analytics').then(r => setData(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex items-center gap-3 text-zinc-400 text-sm">
        <Loader2 size={16} className="animate-spin"/> Loading analytics…
      </div>
    </div>
  )

  const statusLabels = { draft:'Draft',applied:'Applied',responded:'Responded',phone_screen:'Phone Screen',code_test:'Code Test',interview_1:'Interview 1',interview_2:'Interview 2',interview_3:'Interview 3',offer:'Offer',accepted:'Accepted',rejected:'Rejected',withdrawn:'Withdrawn' }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Analytics</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Total', data?.total ?? 0],['Active', data?.activeCount ?? 0],[`${data?.responseRate ?? 0}%`,'Response rate'],['Offers', data?.offersCount ?? 0]].map(([v, l]) => (
              <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-zinc-100">{v}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          {data?.avgDaysToResponse != null && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <Clock size={16} className="text-zinc-500"/><div>
                <p className="text-sm font-medium text-zinc-200">{data.avgDaysToResponse} days avg to first response</p>
              </div>
            </div>
          )}
          {data?.followUpNeeded > 0 && (
            <div className="border border-zinc-800 rounded-xl p-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-zinc-500 shrink-0"/>
              <p className="text-xs text-zinc-400"><strong className="text-zinc-200">{data.followUpNeeded}</strong> application{data.followUpNeeded !== 1 ? 's' : ''} need follow-up (7+ days, no response)</p>
            </div>
          )}
          {data?.weeklyData?.some(w => w.count > 0) && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">Applications per week</p>
              <div className="flex items-end gap-1.5 h-16">
                {data.weeklyData.map((w, i) => {
                  const max = Math.max(...data.weeklyData.map(x => x.count), 1)
                  const h = Math.round((w.count / max) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      {w.count > 0 && <span className="text-[9px] text-zinc-600">{w.count}</span>}
                      <div className="w-full bg-zinc-700 rounded-t" style={{ height: `${h}%`, minHeight: w.count ? 3 : 0 }}/>
                      <span className="text-[8px] text-zinc-700 truncate w-full text-center">{w.week}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">Pipeline</p>
            <div className="space-y-2">
              {Object.entries(data?.byStatus ?? {}).filter(([,v]) => v > 0).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-28 shrink-0">{statusLabels[status] ?? status}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-zinc-500 h-1.5 rounded-full" style={{ width: `${Math.round((count/data.total)*100)}%` }}/>
                  </div>
                  <span className="text-xs text-zinc-500 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          {data?.rejectionReasons?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Rejection Reasons</p>
              {data.rejectionReasons.map((r, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-500 mb-1.5">{r}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobTracker() {
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => api.get('/jobs').then(r => setApps(r.data)), [])

  const syncGmail = async () => {
    setSyncing(true)
    try { await api.post('/gmail/sync'); await load() }
    catch (e) { alert(e.response?.data?.message || 'Sync failed') }
    finally { setSyncing(false) }
  }

  const handleStatusChange = async (appId, status) => {
    try { const { data } = await api.patch(`/jobs/${appId}/status`, { status }); setApps(p => p.map(x => x._id === appId ? data : x)) }
    catch { alert('Status update failed') }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await api.get('/jobs/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url
      const d = res.headers?.['content-disposition']
      a.download = d?.match(/filename="([^"]+)"/)?.[1] ?? 'Jobs.csv'; a.click()
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
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">Job Tracker</h1>
          {followUpCount > 0 && (
            <span className="flex items-center gap-1 border border-zinc-800 text-zinc-500 text-xs px-2 py-0.5 rounded-full">
              <AlertTriangle size={10}/> {followUpCount} follow-up{followUpCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex border border-zinc-800 rounded-xl overflow-hidden">
            <button onClick={() => setView('list')} className={`p-2 transition ${view === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}><LayoutList size={15}/></button>
            <button onClick={() => setView('kanban')} className={`p-2 transition ${view === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}><Columns size={15}/></button>
          </div>
          <button onClick={() => setShowAnalytics(true)} className={btn.ghost}><BarChart2 size={14}/> Analytics</button>
          <button onClick={exportCsv} disabled={exporting} className={btn.ghost}>
            {exporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} Export
          </button>
          <button onClick={syncGmail} disabled={syncing} className={btn.ghost}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''}/> {syncing ? 'Syncing…' : 'Gmail Sync'}
          </button>
          <button onClick={() => setShowNew(true)} className={btn.primary}><Plus size={15}/> New</button>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard apps={apps} onCardClick={setSelected} onStatusChange={handleStatusChange}/>
      ) : (
        <>
          <div className="flex gap-1.5 flex-wrap mb-5">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${filter === 'all' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700'}`}>
              All · {apps.length}
            </button>
            {STATUSES.map(s => {
              const count = apps.filter(a => a.status === s.value).length
              if (!count) return null
              return (
                <button key={s.value} onClick={() => setFilter(s.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${filter === s.value ? 'bg-zinc-700 text-zinc-100 border-zinc-600' : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700'}`}>
                  {s.label} · {count}
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <Briefcase size={32} className="mx-auto text-zinc-800"/>
              <p className="text-zinc-600 text-sm">No applications yet</p>
              <button onClick={() => setShowNew(true)} className="text-xs text-zinc-600 hover:text-zinc-400 underline underline-offset-2">Add your first application</button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(app => (
                <button key={app._id} onClick={() => setSelected(app)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-5 py-3.5 flex items-center gap-4 transition text-left group">
                  <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-zinc-600 group-hover:text-zinc-400 transition"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{app.role}</p>
                    <p className="text-xs text-zinc-600 truncate">
                      {app.company}{app.location ? ` · ${app.location}` : ''}{app.appliedAt ? ` · ${daysAgo(app.appliedAt)}d ago` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {needsFollowUp(app) && <AlertTriangle size={12} className="text-zinc-600"/>}
                    {app.askedBudget && <span className="text-xs text-zinc-700 hidden sm:block">{fmt(app.askedBudget)}</span>}
                    <StatusBadge status={app.status} size="xs"/>
                    <ChevronRight size={13} className="text-zinc-800 group-hover:text-zinc-600 transition"/>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showNew && <NewJobModal onClose={() => setShowNew(false)} onCreated={a => setApps(p => [a, ...p])}/>}
      {selected && <JobDetail app={selected} onClose={() => setSelected(null)} onUpdate={a => { setApps(p => p.map(x => x._id === a._id ? a : x)); setSelected(a) }}/>}
      {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)}/>}
    </div>
  )
}
