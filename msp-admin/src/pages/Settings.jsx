import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle, AlertCircle, RefreshCw, Trash2, Loader2, User, Plus, X } from 'lucide-react'
import api from '../lib/api'

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setInput('')
  }

  const remove = (tag) => onChange(value.filter(t => t !== tag))

  return (
    <div className="border border-zinc-700/60 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-zinc-900">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-blue-900/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-lg">
          {tag}
          <button onClick={() => remove(tag)} className="hover:text-red-500"><X size={11} /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-zinc-200 placeholder-zinc-500"
      />
      {input.trim() && (
        <button onClick={add} className="text-blue-400 hover:text-blue-300"><Plus size={15} /></button>
      )}
    </div>
  )
}

export default function Settings() {
  const [params] = useSearchParams()
  const [gmail, setGmail] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const [prefs, setPrefs] = useState(null)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsForm, setPrefsForm] = useState({
    skills: [],
    jobTitles: [],
    experienceYears: 0,
    expectedCTCMin: '',
    expectedCTCMax: '',
    preferredLocations: [],
  })

  const loadGmail = () => api.get('/gmail/status').then(r => setGmail(r.data)).catch(() => {})

  const loadPrefs = () =>
    api.get('/job-alerts/preferences').then(r => {
      setPrefs(r.data)
      setPrefsForm({
        skills: r.data.skills ?? [],
        jobTitles: r.data.jobTitles ?? [],
        experienceYears: r.data.experienceYears ?? 0,
        expectedCTCMin: r.data.expectedCTCMin ?? '',
        expectedCTCMax: r.data.expectedCTCMax ?? '',
        preferredLocations: r.data.preferredLocations ?? [],
      })
    }).catch(() => {})

  useEffect(() => {
    loadGmail()
    loadPrefs()
    if (params.get('gmail') === 'connected') loadGmail()
  }, [])

  const connectGmail = async () => {
    const { data } = await api.get('/gmail/auth-url')
    window.location.href = data.url
  }

  const disconnectGmail = async () => {
    if (!confirm('Disconnect Gmail?')) return
    await api.delete('/gmail/disconnect')
    setGmail({ connected: false, email: null })
  }

  const syncNow = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/gmail/sync')
      alert(`Inbox scanned. ${data.invitesFound ?? 0} invite(s), ${data.statusUpdates ?? 0} status update(s), ${data.newApplications ?? 0} new application(s).`)
    } catch (e) {
      alert(e.response?.data?.message || 'Sync failed')
    } finally { setSyncing(false) }
  }

  const savePrefs = async () => {
    setPrefsSaving(true)
    try {
      const payload = {
        ...prefsForm,
        experienceYears: Number(prefsForm.experienceYears) || 0,
        expectedCTCMin: prefsForm.expectedCTCMin !== '' ? Number(prefsForm.expectedCTCMin) : undefined,
        expectedCTCMax: prefsForm.expectedCTCMax !== '' ? Number(prefsForm.expectedCTCMax) : undefined,
      }
      const { data } = await api.put('/job-alerts/preferences', payload)
      setPrefs(data)
    } catch (e) {
      alert('Failed to save preferences')
    } finally { setPrefsSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>

      {/* Job Alert Preferences */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-900/20 rounded-xl flex items-center justify-center">
            <User size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-50">Job Alert Preferences</h2>
            <p className="text-sm text-zinc-400">Used to fetch matching jobs from Indeed, Naukri & LinkedIn</p>
          </div>
        </div>

        {prefs === null ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Job Titles to Search</label>
              <TagInput
                value={prefsForm.jobTitles}
                onChange={v => setPrefsForm(f => ({ ...f, jobTitles: v }))}
                placeholder="React Developer, Frontend Engineer…"
              />
              <p className="text-xs text-zinc-500 mt-1">Press Enter or comma to add</p>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Skills</label>
              <TagInput
                value={prefsForm.skills}
                onChange={v => setPrefsForm(f => ({ ...f, skills: v }))}
                placeholder="React, TypeScript, Node.js…"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Preferred Locations</label>
              <TagInput
                value={prefsForm.preferredLocations}
                onChange={v => setPrefsForm(f => ({ ...f, preferredLocations: v }))}
                placeholder="Bangalore, Remote, Mumbai…"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Experience (yrs)</label>
                <input
                  type="number"
                  value={prefsForm.experienceYears}
                  onChange={e => setPrefsForm(f => ({ ...f, experienceYears: e.target.value }))}
                  className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Min CTC (LPA)</label>
                <input
                  type="number"
                  value={prefsForm.expectedCTCMin}
                  onChange={e => setPrefsForm(f => ({ ...f, expectedCTCMin: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Max CTC (LPA)</label>
                <input
                  type="number"
                  value={prefsForm.expectedCTCMax}
                  onChange={e => setPrefsForm(f => ({ ...f, expectedCTCMax: e.target.value }))}
                  placeholder="e.g. 30"
                  className="w-full border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={savePrefs}
              disabled={prefsSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              {prefsSaving ? <Loader2 size={14} className="animate-spin" /> : null}
              {prefsSaving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        )}
      </div>

      {/* Gmail */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-900/20 rounded-xl flex items-center justify-center">
            <Mail size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-50">Gmail Integration</h2>
            <p className="text-sm text-zinc-400">Scan inbox for interview invites, assessments, offers — and update job tracker automatically</p>
          </div>
        </div>

        {gmail === null ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : gmail.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-900/20 rounded-xl">
              <CheckCircle size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-200">Connected as {gmail.email}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={syncNow} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
              <button onClick={disconnectGmail} className="flex items-center gap-2 px-4 py-2 border border-red-800/60 text-red-400 hover:bg-red-900/20 rounded-xl text-sm font-medium">
                <Trash2 size={14} /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-900/20 rounded-xl">
              <AlertCircle size={16} className="text-amber-400" />
              <span className="text-sm text-amber-300">Not connected</span>
            </div>
            <div className="text-sm text-zinc-300 bg-zinc-950 rounded-xl p-4 space-y-1">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                <li>Connect the Gmail account you use for job applications</li>
                <li>Job alert emails from Naukri, Indeed & LinkedIn are auto-imported</li>
                <li>Click "Sync Now" to detect company replies and advance job statuses</li>
              </ul>
            </div>
            <button onClick={connectGmail} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">
              <Mail size={16} /> Connect Gmail
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
