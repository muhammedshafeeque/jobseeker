import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle, AlertCircle, RefreshCw, Trash2, Loader2, User, Plus, X } from 'lucide-react'
import api from '../lib/api'

const TagInput = forwardRef(function TagInput({ value, onChange, placeholder }, ref) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setInput('')
  }

  // Flush any pending typed text synchronously before the parent reads state
  useImperativeHandle(ref, () => ({
    flush: () => {
      const v = input.trim()
      if (v && !value.includes(v)) {
        flushSync(() => {
          onChange([...value, v])
          setInput('')
        })
      }
    },
  }))

  const remove = (tag) => onChange(value.filter(t => t !== tag))

  return (
    <div className="border border-zinc-800 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-zinc-600 bg-zinc-900">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-indigo-950/40 text-indigo-300 text-xs font-medium px-2 py-1 rounded-lg border border-indigo-800/50">
          {tag}
          <button onClick={() => remove(tag)} className="hover:text-zinc-100"><X size={11} /></button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-zinc-200 placeholder-zinc-600"
      />
      {input.trim() && (
        <button onClick={add} className="text-zinc-500 hover:text-zinc-200"><Plus size={15} /></button>
      )}
    </div>
  )
})

export default function Settings() {
  const [params] = useSearchParams()
  const [gmail, setGmail] = useState(null)
  const [syncing, setSyncing] = useState(false)

  const [prefs, setPrefs] = useState(null)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsForm, setPrefsForm] = useState({
    skills: [],
    jobTitles: [],
    experienceYears: 0,
    expectedCTCMin: '',
    expectedCTCMax: '',
    preferredLocations: [],
  })
  const skillsRef = useRef()
  const titlesRef = useRef()
  const locationsRef = useRef()

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

  const disconnectGmail = async (email) => {
    if (!confirm(`Disconnect ${email}?`)) return
    await api.delete('/gmail/disconnect', { data: { email } })
    loadGmail()
  }

  const syncNow = async (email) => {
    setSyncing(true)
    try {
      const params = email ? { email } : {}
      const { data } = await api.post('/gmail/sync', null, { params })
      alert(`Inbox scanned. ${data.invitesFound ?? 0} invite(s), ${data.statusUpdates ?? 0} status update(s), ${data.newApplications ?? 0} new application(s).`)
    } catch (e) {
      alert(e.response?.data?.message || 'Sync failed')
    } finally { setSyncing(false) }
  }

  const savePrefs = async () => {
    // Flush any text typed but not yet added in each TagInput
    skillsRef.current?.flush()
    titlesRef.current?.flush()
    locationsRef.current?.flush()

    setPrefsSaving(true)
    try {
      const payload = {
        ...prefsForm,
        experienceYears: Number(prefsForm.experienceYears) || 0,
        expectedCTCMin: prefsForm.expectedCTCMin !== '' ? Number(prefsForm.expectedCTCMin) : null,
        expectedCTCMax: prefsForm.expectedCTCMax !== '' ? Number(prefsForm.expectedCTCMax) : null,
      }
      const { data } = await api.put('/job-alerts/preferences', payload)
      setPrefs(data)
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2500)
    } catch {
      alert('Failed to save preferences')
    } finally {
      setPrefsSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>

      {/* Job Alert Preferences */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
            <User size={18} className="text-zinc-400" />
          </div>
          <div>
            <h2 className="font-medium text-zinc-100">Job Alert Preferences</h2>
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
                ref={titlesRef}
                value={prefsForm.jobTitles}
                onChange={v => setPrefsForm(f => ({ ...f, jobTitles: v }))}
                placeholder="React Developer, Frontend Engineer…"
              />
              <p className="text-xs text-zinc-500 mt-1">Press Enter or comma to add</p>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Skills</label>
              <TagInput
                ref={skillsRef}
                value={prefsForm.skills}
                onChange={v => setPrefsForm(f => ({ ...f, skills: v }))}
                placeholder="React, TypeScript, Node.js…"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">Preferred Locations</label>
              <TagInput
                ref={locationsRef}
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Max CTC (LPA)</label>
                <input
                  type="number"
                  value={prefsForm.expectedCTCMax}
                  onChange={e => setPrefsForm(f => ({ ...f, expectedCTCMax: e.target.value }))}
                  placeholder="e.g. 30"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
            </div>

            <button
              onClick={savePrefs}
              disabled={prefsSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              {prefsSaving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : prefsSaved
                  ? <><CheckCircle size={14} /> Saved!</>
                  : 'Save Preferences'
              }
            </button>
          </div>
        )}
      </div>

      {/* Gmail */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
            <Mail size={18} className="text-zinc-400" />
          </div>
          <div>
            <h2 className="font-medium text-zinc-100">Gmail Integration</h2>
            <p className="text-sm text-zinc-400">Scan inbox for interview invites, assessments, offers — and update job tracker automatically</p>
          </div>
        </div>

        {gmail === null ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="space-y-3">
            {(gmail.accounts ?? []).length > 0 ? (
              <>
                {gmail.accounts.map(account => (
                  <div key={account.email} className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-200 truncate">{account.email}</p>
                      {account.lastSyncAt && (
                        <p className="text-xs text-zinc-500">Last sync: {new Date(account.lastSyncAt).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => syncNow(account.email)}
                        disabled={syncing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium disabled:opacity-60"
                      >
                        {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Sync
                      </button>
                      <button
                        onClick={() => disconnectGmail(account.email)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 rounded-lg text-xs font-medium transition"
                      >
                        <Trash2 size={12} /> Disconnect
                      </button>
                    </div>
                  </div>
                ))}
                {gmail.accounts.length > 1 && (
                  <button
                    onClick={() => syncNow(null)}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 rounded-xl text-sm font-medium transition disabled:opacity-60"
                  >
                    {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Sync All Accounts
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                <AlertCircle size={15} className="text-zinc-500" />
                <span className="text-sm text-zinc-400">No Gmail accounts connected</span>
              </div>
            )}

            <div className="text-sm text-zinc-300 bg-zinc-950 rounded-xl p-4 space-y-1">
              <p className="font-medium text-xs text-zinc-400">How it works:</p>
              <ul className="list-disc pl-4 space-y-1 text-zinc-500 text-xs">
                <li>Connect any Gmail you use for job applications</li>
                <li>Job alert emails from Naukri, Indeed & LinkedIn are auto-imported</li>
                <li>Sync detects company replies and advances your job statuses</li>
                <li>You can connect multiple accounts</li>
              </ul>
            </div>
            <button onClick={connectGmail} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition">
              <Plus size={15} /> Connect{(gmail.accounts ?? []).length > 0 ? ' Another' : ''} Gmail
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
