import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Bell, RefreshCw, Loader2, Bookmark, BookmarkCheck,
  X, ExternalLink, Briefcase, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
} from 'lucide-react'
import api from '../lib/api'

// Wraps raw HTML email in a minimal shell with reset styles, then auto-sizes height
function EmailIframe({ html }) {
  const ref = useRef(null)

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#202124;word-break:break-word;background:#fff}
  *{max-width:100%!important;box-sizing:border-box}
  img{max-width:100%!important;height:auto!important}
  a{color:#1a73e8}
  table{border-collapse:collapse}
  td,th{word-break:break-word}
</style>
</head>
<body>${html}</body>
</html>`

  const handleLoad = () => {
    const iframe = ref.current
    if (!iframe) return
    try {
      const h = iframe.contentDocument?.body?.scrollHeight
      if (h) iframe.style.height = h + 16 + 'px'
    } catch {}
  }

  return (
    <iframe
      ref={ref}
      srcDoc={srcdoc}
      sandbox="allow-same-origin"
      onLoad={handleLoad}
      className="w-full border-0 rounded-xl"
      style={{ minHeight: 120 }}
      title="Email content"
    />
  )
}

const SOURCE_LABELS = {
  indeed: { label: 'Indeed', color: 'bg-zinc-900 text-zinc-400' },
  naukri: { label: 'Naukri', color: 'bg-orange-900/40 text-orange-300' },
  linkedin: { label: 'LinkedIn', color: 'bg-sky-900/40 text-sky-300' },
  gmail: { label: 'Gmail', color: 'bg-zinc-900 text-zinc-500' },
  manual: { label: 'Manual', color: 'bg-zinc-800 text-zinc-300' },
}

function AlertCard({ alert, onRead, onSave, onDismiss, onApply }) {
  const [applying, setApplying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const src = SOURCE_LABELS[alert.source] ?? SOURCE_LABELS.manual

  const hasHtml = !!alert.htmlBody
  const plainContent = alert.body || alert.snippet || ''
  const previewContent = plainContent.slice(0, 300)
  const hasMore = hasHtml || plainContent.length > 300

  const handleApply = async () => {
    if (!confirm(`Create a job application draft for "${alert.title}"?`)) return
    setApplying(true)
    try {
      await onApply(alert._id)
    } finally {
      setApplying(false)
    }
  }

  const handleCardClick = () => {
    if (!alert.isRead) onRead(alert._id)
  }

  return (
    <div
      className={`bg-zinc-900 rounded-2xl border transition ${
        alert.isRead ? 'border-zinc-800' : 'border-zinc-700 shadow-sm'
      }`}
      onClick={handleCardClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.color}`}>
                {src.label}
              </span>
              {!alert.isRead && (
                <span className="w-2 h-2 rounded-full bg-zinc-500 flex-shrink-0" />
              )}
              {alert.appliedJobId && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  Applied
                </span>
              )}
            </div>
            <h3 className="font-semibold text-zinc-50 text-sm leading-snug">
              {alert.title}
            </h3>
            {(alert.company || alert.location) && (
              <p className="text-xs text-zinc-400 mt-1">
                {[alert.company, alert.location].filter(Boolean).join(' · ')}
              </p>
            )}
            {(alert.salaryMin || alert.salaryMax) && (
              <p className="text-xs text-zinc-300 font-medium mt-1">
                {alert.salaryMin && alert.salaryMax
                  ? `${alert.salaryMin}–${alert.salaryMax} LPA`
                  : `${alert.salaryMin ?? alert.salaryMax} LPA`}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onSave(alert._id) }}
              className={`p-1.5 rounded-lg transition ${
                alert.isSaved
                  ? 'text-zinc-500 hover:bg-zinc-800'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
              title={alert.isSaved ? 'Unsave' : 'Save'}
            >
              {alert.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDismiss(alert._id) }}
              className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400 transition"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Email body */}
        {(plainContent || hasHtml) && (
          <div className="mt-3" onClick={e => e.stopPropagation()}>
            {/* Collapsed plain-text preview — always visible */}
            {!expanded && (
              <div className="text-xs text-zinc-400 leading-relaxed line-clamp-3 bg-zinc-950 rounded-xl p-3">
                {previewContent}
                {hasMore && <span className="text-zinc-500"> …</span>}
              </div>
            )}

            {/* Expanded: HTML iframe if available, else plain text */}
            {expanded && (
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
                {hasHtml
                  ? <EmailIframe html={alert.htmlBody} />
                  : (
                    <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap p-4 max-h-[600px] overflow-y-auto">
                      {plainContent}
                    </div>
                  )
                }
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 mt-1.5 px-1"
              >
                {expanded
                  ? <><ChevronUp size={12} /> Collapse</>
                  : <><ChevronDown size={12} /> {hasHtml ? 'View full email' : 'Show more'}</>
                }
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">
            {alert.postedAt ? new Date(alert.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
          </span>
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {alert.url && (
              <a
                href={alert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <ExternalLink size={12} /> View in Gmail
              </a>
            )}
            {!alert.appliedJobId && (
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-1 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1 rounded-lg transition disabled:opacity-60"
              >
                {applying ? <Loader2 size={12} className="animate-spin" /> : <Briefcase size={12} />}
                Apply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JobAlerts() {
  const [data, setData] = useState({ alerts: [], total: 0, unreadCount: 0, savedCount: 0, page: 1 })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // all | unread | saved
  const [source, setSource] = useState('all')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, source }
      if (activeTab === 'unread') params.read = 'false'
      if (activeTab === 'saved') params.saved = 'true'
      const { data: res } = await api.get('/job-alerts', { params })
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeTab, source, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [activeTab, source])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data: res } = await api.post('/job-alerts/sync')
      alert(`Sync done — ${res.added} new alert(s) added (Indeed: ${res.sources.indeed}, Gmail: ${res.sources.gmail})`)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Sync failed')
    } finally {
      setSyncing(false) }
  }

  const handleRead = async (id) => {
    await api.patch(`/job-alerts/${id}/read`)
    setData(d => ({
      ...d,
      alerts: d.alerts.map(a => a._id === id ? { ...a, isRead: true } : a),
      unreadCount: Math.max(0, d.unreadCount - 1),
    }))
  }

  const handleSave = async (id) => {
    const { data: updated } = await api.patch(`/job-alerts/${id}/save`)
    setData(d => ({ ...d, alerts: d.alerts.map(a => a._id === id ? updated : a) }))
  }

  const handleDismiss = async (id) => {
    await api.patch(`/job-alerts/${id}/dismiss`)
    setData(d => ({ ...d, alerts: d.alerts.filter(a => a._id !== id), total: d.total - 1 }))
  }

  const handleApply = async (id) => {
    const { data: res } = await api.post(`/job-alerts/${id}/apply`)
    setData(d => ({ ...d, alerts: d.alerts.map(a => a._id === id ? { ...a, appliedJobId: res.application._id } : a) }))
  }

  const totalPages = Math.ceil(data.total / 20)

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Job Alerts</h1>
            <p className="text-sm text-zinc-400">Jobs matching your profile from Naukri, Indeed & LinkedIn</p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-sm font-medium disabled:opacity-60 transition"
        >
          {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: data.total, color: 'text-zinc-50' },
          { label: 'Unread', value: data.unreadCount, color: 'text-zinc-400' },
          { label: 'Saved', value: data.savedCount, color: 'text-zinc-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-zinc-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Tabs */}
        <div className="flex bg-zinc-800 rounded-xl p-1 gap-1">
          {[['all', 'All'], ['unread', 'Unread'], ['saved', 'Saved']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setActiveTab(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === v ? 'bg-zinc-900 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex bg-zinc-800 rounded-xl p-1 gap-1">
          {[['all', 'All'], ['indeed', 'Indeed'], ['naukri', 'Naukri'], ['linkedin', 'LinkedIn'], ['gmail', 'Gmail']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setSource(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                source === v ? 'bg-zinc-900 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : data.alerts.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
          <Bell size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No alerts yet</p>
          <p className="text-zinc-500 text-sm mt-1">
            Set up your preferences in Settings and click Sync Now
          </p>
        </div>
      ) : (
        <div className="grid gap-3 w-full">
          {data.alerts.map(alert => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onRead={handleRead}
              onSave={handleSave}
              onDismiss={handleDismiss}
              onApply={handleApply}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-950 disabled:opacity-40 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-zinc-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-zinc-800 hover:bg-zinc-950 disabled:opacity-40 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
