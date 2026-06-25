import { useEffect, useState } from 'react'
import { MessageSquare, ChevronRight, X, Loader2 } from 'lucide-react'
import api from '../lib/api'
import socket from '../lib/socket'

const STATUSES = [
  { value: 'unread',           label: 'Unread',           color: 'bg-zinc-900 text-zinc-400' },
  { value: 'viewed',           label: 'Viewed',           color: 'bg-zinc-900 text-zinc-300' },
  { value: 'connected',        label: 'Connected',        color: 'bg-zinc-900 text-zinc-400' },
  { value: 'application_sent', label: 'Application Sent', color: 'bg-teal-900/40 text-teal-300' },
  { value: 'mail_sent',        label: 'Mail Sent',        color: 'bg-zinc-900 text-zinc-500' },
  { value: 'closed',           label: 'Closed',           color: 'bg-zinc-800 text-zinc-400' },
]

const badge = status => {
  const s = STATUSES.find(s => s.value === status) || STATUSES[0]
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
}

function EnquiryDetail({ item, onClose, onUpdate }) {
  const [status, setStatus] = useState(item.status)
  const [note, setNote] = useState('')
  const [adminNote, setAdminNote] = useState(item.adminNote || '')
  const [saving, setSaving] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const updateStatus = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch(`/contacts/${item._id}/status`, { status, note })
      onUpdate(data)
      setNote('')
    } finally { setSaving(false) }
  }

  const saveNote = async () => {
    setSavingNote(true)
    try {
      const { data } = await api.patch(`/contacts/${item._id}/note`, { adminNote })
      onUpdate(data)
    } finally { setSavingNote(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-zinc-50">{item.name}</h2>
            <a href={`mailto:${item.email}`} className="text-sm text-zinc-400 hover:text-zinc-200 hover:underline">{item.email}</a>
            {item.phone && (
              <a href={`tel:${item.phone}`} className="block text-xs text-zinc-400 hover:text-zinc-200 mt-0.5">{item.phone}</a>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-zinc-950 rounded-xl p-4">
            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{item.message}</p>
            <p className="text-xs text-zinc-500 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Status</p>
            <div className="flex gap-2 flex-wrap mb-2">
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${status === s.value ? 'ring-1 ring-zinc-600 ' + s.color : 'border-zinc-800 text-zinc-300 hover:bg-zinc-950'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note…"
                className="flex-1 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              <button onClick={updateStatus} disabled={saving} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-1.5">
                {saving && <Loader2 size={13} className="animate-spin" />} Save
              </button>
            </div>
          </div>

          {item.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">History</p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {[...item.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {badge(h.status)}
                    {h.note && <span className="text-zinc-400">{h.note}</span>}
                    <span className="text-zinc-500 ml-auto">{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Admin Note</p>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
              className="w-full border border-zinc-800 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-zinc-600 mb-2" />
            <button onClick={saveNote} disabled={savingNote} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center gap-1.5">
              {savingNote && <Loader2 size={13} className="animate-spin" />} Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Enquiries() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const load = () => api.get('/contacts').then(r => setItems(r.data))

  useEffect(() => {
    load()
    socket.on('contact:new', c => setItems(p => [c, ...p]))
    socket.on('contact:updated', c => setItems(p => p.map(x => x._id === c._id ? c : x)))
    return () => { socket.off('contact:new'); socket.off('contact:updated') }
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-50">Portfolio Enquiries</h1>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filter === 'all' ? 'bg-zinc-700 text-zinc-50' : 'border border-zinc-800 text-zinc-300 hover:bg-zinc-950'}`}>All ({items.length})</button>
        {STATUSES.map(s => {
          const count = items.filter(i => i.status === s.value).length
          if (count === 0) return null
          return (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filter === s.value ? s.color + ' ring-1 ring-zinc-500' : 'border border-zinc-800 text-zinc-300 hover:bg-zinc-950'}`}>
              {s.label} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>No enquiries yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <button key={item._id} onClick={() => setSelected(item)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-zinc-600 transition text-left">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-50">{item.name}</p>
                <p className="text-sm text-zinc-400 truncate">{item.message}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {badge(item.status)}
                <span className="text-xs text-zinc-500 hidden sm:block">{new Date(item.createdAt).toLocaleDateString()}</span>
                <ChevronRight size={16} className="text-zinc-500" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <EnquiryDetail item={selected} onClose={() => setSelected(null)} onUpdate={c => { setItems(p => p.map(x => x._id === c._id ? c : x)); setSelected(c) }} />}
    </div>
  )
}
