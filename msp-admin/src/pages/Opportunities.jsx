import { useEffect, useState, useCallback, useRef } from 'react'
import {
  TrendingUp, Loader2, ExternalLink, Briefcase, X,
  ChevronUp, ChevronDown, Mail, FileText, ScrollText,
} from 'lucide-react'
import api from '../lib/api'
import { buildJobDescription, downloadResumePdf, downloadCoverLetterPdf } from '../lib/resumePdf'

const formatEmailDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

// ── Match badge ──────────────────────────────────────────────────────────────
const MATCH = [
  { label: 'Low',       bg: 'bg-zinc-900', text: 'text-zinc-600', dot: 'bg-zinc-700' },
  { label: 'Fair',      bg: 'bg-amber-950/40',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
  { label: 'Good',      bg: 'bg-blue-950/40',    text: 'text-blue-400',    dot: 'bg-blue-500'    },
  { label: 'Great',     bg: 'bg-emerald-950/40', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { label: 'Excellent', bg: 'bg-emerald-900/60', text: 'text-emerald-200', dot: 'bg-emerald-400' },
]

function MatchBadge({ score }) {
  const m = MATCH[Math.min(score ?? 0, 4)]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  draft:        'bg-zinc-800 text-zinc-300',
  applied:      'bg-blue-950/50 text-blue-300',
  responded:    'bg-red-950/40 text-red-400',
  phone_screen: 'bg-red-950/40 text-red-400',
  code_test:    'bg-orange-900/40 text-orange-300',
  interview_1:  'bg-zinc-800 text-zinc-300',
  interview_2:  'bg-zinc-800 text-zinc-300',
  interview_3:  'bg-zinc-800 text-zinc-300',
  offer:        'bg-zinc-800 text-zinc-200',
  accepted:     'bg-zinc-700 text-zinc-100',
  rejected:     'bg-red-950/40 text-red-400',
  withdrawn:    'bg-zinc-800 text-zinc-400',
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-xs text-zinc-500">—</span>
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-zinc-800 text-zinc-300'}`}>
      {label}
    </span>
  )
}

// ── Source chip ───────────────────────────────────────────────────────────────
const SRC = {
  indeed:  'bg-blue-950/50 text-blue-300',
  naukri:  'bg-orange-900/40 text-orange-300',
  linkedin:'bg-sky-900/40 text-sky-300',
  gmail:   'bg-red-950/40 text-red-400',
  manual:  'bg-zinc-800 text-zinc-400',
}

// ── Email drawer ──────────────────────────────────────────────────────────────
function EmailDrawer({ alertId, onClose }) {
  const [alert, setAlert] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (!alertId) return
    setAlert(null)
    api.get(`/job-alerts/${alertId}`).then(r => setAlert(r.data)).catch(() => setAlert(false))
  }, [alertId])

  const handleIframeLoad = () => {
    try {
      const h = iframeRef.current?.contentDocument?.body?.scrollHeight
      if (h) iframeRef.current.style.height = h + 16 + 'px'
    } catch {}
  }

  if (!alertId) return null

  const srcdoc = alert?.htmlBody ? `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{margin:0;padding:14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#202124;word-break:break-word;background:#fff}
  *{max-width:100%!important;box-sizing:border-box}
  img{max-width:100%!important;height:auto!important}
  a{color:#1a73e8}
  table{border-collapse:collapse}
  td,th{word-break:break-word}
</style></head>
<body>${alert.htmlBody}</body></html>` : null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Drawer */}
      <div className="w-[600px] max-w-full bg-zinc-900 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-zinc-800">
          <div className="flex-1 min-w-0">
            {alert ? (
              <>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SRC[alert.source] ?? SRC.manual}`}>
                    {alert.source}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {alert.postedAt ? new Date(alert.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                <h2 className="font-semibold text-zinc-50 text-sm leading-snug">{alert.title}</h2>
                {alert.company && <p className="text-xs text-zinc-400 mt-0.5">{alert.company}{alert.location ? ` · ${alert.location}` : ''}</p>}
              </>
            ) : alert === null ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>
            ) : (
              <p className="text-sm text-zinc-500">Failed to load email</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {alert?.url && (
              <a href={alert.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition">
                <ExternalLink size={13} /> Open in Gmail
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-emerald-200">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {alert && (
            srcdoc
              ? <iframe ref={iframeRef} srcDoc={srcdoc} sandbox="allow-same-origin" onLoad={handleIframeLoad}
                  className="w-full border-0" style={{ minHeight: 300 }} title="Email" />
              : alert.body
                ? <pre className="p-5 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">{alert.body}</pre>
                : <p className="p-5 text-sm text-zinc-500">No email content available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sort helper ───────────────────────────────────────────────────────────────
function useSortedData(rows) {
  const [sort, setSort] = useState({ col: 'matchScore', dir: 'desc' })

  const toggle = (col) => setSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))

  const sorted = [...(rows ?? [])].sort((a, b) => {
    const av = a[sort.col] ?? (sort.dir === 'asc' ? Infinity : -Infinity)
    const bv = b[sort.col] ?? (sort.dir === 'asc' ? Infinity : -Infinity)
    if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sort.dir === 'asc' ? av - bv : bv - av
  })

  return { sorted, sort, toggle }
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronUp size={12} className="text-zinc-600" />
  return sort.dir === 'asc'
    ? <ChevronUp size={12} className="text-zinc-400" />
    : <ChevronDown size={12} className="text-zinc-400" />
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Opportunities() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [drawerAlertId, setDrawerAlertId] = useState(null)
  const [downloading, setDownloading] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const { data: res } = await api.get('/job-alerts/opportunities', { params })
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleDismiss = async (id) => {
    await api.patch(`/job-alerts/${id}/dismiss`)
    setData(d => ({ ...d, opportunities: d.opportunities.filter(o => o._id !== id), total: d.total - 1 }))
  }

  const handleApply = async (opp) => {
    if (!confirm(`Create a draft application for "${opp.title}"?`)) return
    const { data: res } = await api.post(`/job-alerts/${opp._id}/apply`)
    setData(d => ({
      ...d,
      opportunities: d.opportunities.map(o =>
        o._id === opp._id ? { ...o, appliedJobId: res.application._id, applicationStatus: 'draft' } : o
      ),
    }))
  }

  const setDl = (key, val) => setDownloading(d => ({ ...d, [key]: val }))

  const handleDownloadCv = async (opp) => {
    const key = `${opp._id}-cv`
    setDl(key, true)
    try {
      await downloadResumePdf({
        jd: buildJobDescription(opp),
        company: opp.company,
        role: opp.title,
      })
    } catch (e) {
      alert(e.response?.data?.message || 'CV download failed — check GROQ_API_KEY in server .env')
    } finally {
      setDl(key, false)
    }
  }

  const handleDownloadCoverLetter = async (opp) => {
    const key = `${opp._id}-cl`
    setDl(key, true)
    try {
      await downloadCoverLetterPdf({
        jd: buildJobDescription(opp),
        company: opp.company,
        role: opp.title,
      })
    } catch (e) {
      alert(e.response?.data?.message || 'Cover letter download failed — check GROQ_API_KEY in server .env')
    } finally {
      setDl(key, false)
    }
  }

  // Filter by source
  const rows = (data?.opportunities ?? []).filter(o => sourceFilter === 'all' || o.source === sourceFilter)
  const { sorted, sort, toggle } = useSortedData(rows)

  const columns = [
    { key: 'matchScore',       label: 'Match',       sortable: true  },
    { key: 'title',            label: 'Job Title',   sortable: true  },
    { key: 'company',          label: 'Company',     sortable: true  },
    { key: 'location',         label: 'Location',    sortable: false },
    { key: 'postedAt',         label: 'Email Date',  sortable: true  },
    { key: 'experienceMax',    label: 'Exp. Needed', sortable: true  },
    { key: 'salaryMax',        label: 'Max Budget',  sortable: true  },
    { key: 'applicationStatus',label: 'Status',      sortable: false },
    { key: '_actions',         label: 'Actions',     sortable: false },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-zinc-950">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 flex items-center justify-between flex-shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-50">Opportunities</h1>
            <p className="text-xs sm:text-sm text-zinc-400 truncate">
              {loading ? 'Loading…' : `${data?.total ?? 0} shown`}
              {!loading && data?.minExpectedLpa
                ? ` · budget ≥ ₹${data.minExpectedLpa}L`
                : !loading ? ' · budget mentioned only' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
        {/* Status filter */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1 overflow-x-auto">
          {[['all','All'],['not_applied','Not Applied'],['applied','Applied']].map(([v,l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${statusFilter === v ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {l}
            </button>
          ))}
        </div>
        {/* Source filter */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1 overflow-x-auto">
          {[['all','All'],['indeed','Indeed'],['naukri','Naukri'],['linkedin','LinkedIn'],['gmail','Gmail']].map(([v,l]) => (
            <button key={v} onClick={() => setSourceFilter(v)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${sourceFilter === v ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-zinc-500" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
            <TrendingUp size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No opportunities yet</p>
            <p className="text-zinc-500 text-sm mt-1">
              {data?.minExpectedLpa
                ? `Only jobs with budget ≥ ₹${data.minExpectedLpa}L from Settings are shown`
                : 'Sync Job Alerts and set your min expected LPA in Settings'}
            </p>
          </div>
        ) : (<>
          {/* ── Mobile card list (< md) ── */}
          <div className="md:hidden space-y-2">
            {sorted.map(opp => {
              const salary = opp.salaryMin && opp.salaryMax ? `₹${opp.salaryMin}–${opp.salaryMax}L`
                : opp.salaryMax ? `₹${opp.salaryMax}L` : opp.salaryMin ? `₹${opp.salaryMin}L+` : null
              return (
                <div key={opp._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <MatchBadge score={opp.matchScore} />
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${SRC[opp.source] ?? SRC.manual}`}>
                          {opp.source?.slice(0,1).toUpperCase()}
                        </span>
                        {opp.applicationStatus && <StatusBadge status={opp.applicationStatus} />}
                      </div>
                      <p className="font-medium text-zinc-100 text-sm leading-snug">{opp.title}</p>
                      {opp.company && <p className="text-xs text-zinc-400 mt-0.5">{opp.company}{opp.location ? ` · ${opp.location}` : ''}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    {salary && <span className="text-emerald-300 font-medium">{salary}</span>}
                    {(opp.experienceMin != null || opp.experienceMax != null) && (
                      <span className="text-zinc-500">
                        {opp.experienceMin != null && opp.experienceMax != null
                          ? `${opp.experienceMin}–${opp.experienceMax} yrs`
                          : opp.experienceMin != null ? `${opp.experienceMin}+ yrs` : `≤${opp.experienceMax} yrs`}
                      </span>
                    )}
                    <span className="text-zinc-600">{formatEmailDate(opp.postedAt ?? opp.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-1 border-t border-zinc-800">
                    <button onClick={() => handleDownloadCv(opp)} disabled={downloading[`${opp._id}-cv`]}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition disabled:opacity-40">
                      {downloading[`${opp._id}-cv`] ? <Loader2 size={12} className="animate-spin"/> : <FileText size={12}/>} CV
                    </button>
                    <button onClick={() => handleDownloadCoverLetter(opp)} disabled={downloading[`${opp._id}-cl`]}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition disabled:opacity-40">
                      {downloading[`${opp._id}-cl`] ? <Loader2 size={12} className="animate-spin"/> : <ScrollText size={12}/>} Letter
                    </button>
                    <button onClick={() => setDrawerAlertId(opp._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition">
                      <Mail size={12}/> Email
                    </button>
                    {!opp.appliedJobId && (
                      <button onClick={() => handleApply(opp)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition">
                        <Briefcase size={12}/> Apply
                      </button>
                    )}
                    <button onClick={() => handleDismiss(opp._id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition">
                      <X size={14}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop table (≥ md) ── */}
          <div className="hidden md:block bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
                  {columns.map(col => (
                    <th key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-zinc-100' : ''}`}
                      onClick={() => col.sortable && toggle(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sortable && <SortIcon col={col.key} sort={sort} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sorted.map(opp => (
                  <tr key={opp._id} className="hover:bg-zinc-950 transition group">
                    <td className="px-4 py-3 whitespace-nowrap"><MatchBadge score={opp.matchScore} /></td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${SRC[opp.source] ?? SRC.manual} flex-shrink-0`}>
                          {opp.source?.slice(0,1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-50 text-sm line-clamp-2 leading-snug">{opp.title}</p>
                          {opp.snippet && <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{opp.snippet}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-zinc-200 font-medium">{opp.company || <span className="text-zinc-600">—</span>}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-400 text-xs">{opp.location || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-400">{formatEmailDate(opp.postedAt ?? opp.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {opp.experienceMin != null || opp.experienceMax != null ? (
                        <span className="font-medium text-emerald-200">
                          {opp.experienceMin != null && opp.experienceMax != null
                            ? `${opp.experienceMin}–${opp.experienceMax} yrs`
                            : opp.experienceMin != null ? `${opp.experienceMin}+ yrs` : `≤${opp.experienceMax} yrs`}
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {opp.salaryMax || opp.salaryMin ? (
                        <span className="font-semibold text-emerald-200">
                          {opp.salaryMin && opp.salaryMax ? `₹${opp.salaryMin}–${opp.salaryMax}L`
                            : opp.salaryMax ? `₹${opp.salaryMax}L` : `₹${opp.salaryMin}L+`}
                        </span>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={opp.applicationStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button onClick={() => handleDownloadCv(opp)} disabled={downloading[`${opp._id}-cv`]}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 text-zinc-400 transition disabled:opacity-40" title="Download matching CV">
                          {downloading[`${opp._id}-cv`] ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>}
                        </button>
                        <button onClick={() => handleDownloadCoverLetter(opp)} disabled={downloading[`${opp._id}-cl`]}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 text-zinc-400 transition disabled:opacity-40" title="Download cover letter">
                          {downloading[`${opp._id}-cl`] ? <Loader2 size={14} className="animate-spin"/> : <ScrollText size={14}/>}
                        </button>
                        <button onClick={() => setDrawerAlertId(opp._id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 text-zinc-400 transition" title="View email">
                          <Mail size={14}/>
                        </button>
                        {opp.url && (
                          <a href={opp.url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition" title="Open job listing">
                            <ExternalLink size={14}/>
                          </a>
                        )}
                        {!opp.appliedJobId && (
                          <button onClick={() => handleApply(opp)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-300 text-zinc-500 transition" title="Create application">
                            <Briefcase size={14}/>
                          </button>
                        )}
                        <button onClick={() => handleDismiss(opp._id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-400 text-zinc-500 transition" title="Dismiss">
                          <X size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>)}
      </div>

      {/* Email drawer */}
      <EmailDrawer alertId={drawerAlertId} onClose={() => setDrawerAlertId(null)} />
    </div>
  )
}
