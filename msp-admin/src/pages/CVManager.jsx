import { useEffect, useRef, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Upload, Wand2, Download, FileText, Loader2, CheckCircle, Plus, Trash2,
  ChevronDown, ChevronUp, LayoutTemplate, Pencil, X, Save,
} from 'lucide-react'
import api from '../lib/api'

// ── Tiny helpers ──────────────────────────────────────────────────────────────

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs font-medium text-zinc-400 block mb-1">{label}</label>}
    <input
      {...props}
      className="w-full bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
)

const Textarea = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs font-medium text-zinc-400 block mb-1">{label}</label>}
    <textarea
      {...props}
      className="w-full bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    />
  </div>
)

const SectionCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/50 transition"
      >
        <span className="font-semibold text-zinc-100 text-sm">{title}</span>
        {open ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  )
}

// Lines-to-array and array-to-lines
const toLines = arr => (arr ?? []).join('\n')
const fromLines = text => text.split('\n').map(s => s.trim()).filter(Boolean)

// ── Template Picker ───────────────────────────────────────────────────────────

function TemplatePicker({ onSelect, onManual }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/cv-templates').then(r => setTemplates(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-50 mb-2">Set up your CV</h2>
        <p className="text-zinc-400 text-sm">Start from a pre-built template or create from scratch.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 size={16} className="animate-spin" /> Loading templates…</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          {templates.map(t => (
            <button
              key={t._id}
              onClick={() => onSelect(t._id)}
              className="text-left p-4 bg-zinc-900 border border-zinc-700/60 rounded-2xl hover:border-blue-500/60 hover:bg-zinc-800 transition group"
            >
              <div className="w-8 h-8 bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                <LayoutTemplate size={16} className="text-blue-400" />
              </div>
              <p className="font-semibold text-zinc-100 text-sm group-hover:text-blue-300 transition">{t.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
              <span className="inline-block mt-2 text-xs bg-zinc-800 text-zinc-400 rounded-lg px-2 py-0.5">{t.category}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onManual}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
      >
        <Pencil size={14} /> Start with a blank profile
      </button>
    </div>
  )
}

// ── Profile Editor ────────────────────────────────────────────────────────────

const BLANK_PROFILE = {
  header: { name: '', title: '', email: '', phone: '', links: [] },
  summary: [],
  experience: [],
  projects: [],
  coreSkills: [],
  awards: [],
  certifications: [],
  education: [],
  footerNote: '',
}

function ProfileEditor({ initial, onSaved }) {
  const [data, setData] = useState(initial ?? BLANK_PROFILE)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = useCallback((path, value) => {
    setData(d => {
      const clone = JSON.parse(JSON.stringify(d))
      const keys = path.split('.')
      let obj = clone
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return clone
    })
  }, [])

  const addItem = (key, blank) => setData(d => ({ ...d, [key]: [...(d[key] ?? []), blank] }))
  const removeItem = (key, idx) => setData(d => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }))
  const setItem = (key, idx, value) => setData(d => {
    const arr = [...(d[key] ?? [])]
    arr[idx] = value
    return { ...d, [key]: arr }
  })

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/cv/profile', data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved?.(data)
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-zinc-50">Edit CV Profile</h2>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* Header */}
      <SectionCard title="Personal Details">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" value={data.header.name} onChange={e => set('header.name', e.target.value)} placeholder="Jane Smith" />
          <Input label="Job Title" value={data.header.title} onChange={e => set('header.title', e.target.value)} placeholder="Senior Software Engineer" />
          <Input label="Email" type="email" value={data.header.email} onChange={e => set('header.email', e.target.value)} placeholder="jane@email.com" />
          <Input label="Phone" value={data.header.phone} onChange={e => set('header.phone', e.target.value)} placeholder="+1 555-000-0000" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-2">Links</label>
          {(data.header.links ?? []).map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select
                value={link.icon}
                onChange={e => {
                  const arr = [...data.header.links]
                  arr[i] = { ...arr[i], icon: e.target.value }
                  set('header.links', arr)
                }}
                className="bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none"
              >
                {['linkedin', 'github', 'npm', 'medium', 'web'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input
                value={link.url}
                onChange={e => {
                  const arr = [...data.header.links]
                  arr[i] = { ...arr[i], url: e.target.value }
                  set('header.links', arr)
                }}
                placeholder="https://…"
                className="flex-1 bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => {
                const arr = data.header.links.filter((_, j) => j !== i)
                set('header.links', arr)
              }} className="text-red-500 hover:text-red-400 px-1"><X size={15} /></button>
            </div>
          ))}
          <button
            onClick={() => set('header.links', [...(data.header.links ?? []), { icon: 'linkedin', url: '' }])}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
          >
            <Plus size={13} /> Add link
          </button>
        </div>
      </SectionCard>

      {/* Summary */}
      <SectionCard title="Professional Summary">
        <Textarea
          label="One paragraph per line"
          value={toLines(data.summary)}
          onChange={e => setData(d => ({ ...d, summary: fromLines(e.target.value) }))}
          rows={5}
          placeholder="Results-driven engineer with 5+ years…&#10;Second paragraph…"
        />
      </SectionCard>

      {/* Experience */}
      <SectionCard title="Work Experience">
        {(data.experience ?? []).map((exp, i) => (
          <div key={i} className="bg-zinc-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Position {i + 1}</span>
              <button onClick={() => removeItem('experience', i)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Job Title" value={exp.role} onChange={e => setItem('experience', i, { ...exp, role: e.target.value })} placeholder="Senior Engineer" />
              <Input label="Company" value={exp.company} onChange={e => setItem('experience', i, { ...exp, company: e.target.value })} placeholder="Acme Corp" />
              <Input label="Period" value={exp.period} onChange={e => setItem('experience', i, { ...exp, period: e.target.value })} placeholder="Jan 2022 – Present" className="col-span-2" />
            </div>
            <Textarea
              label="Bullet points (one per line)"
              value={toLines(exp.points)}
              onChange={e => setItem('experience', i, { ...exp, points: fromLines(e.target.value) })}
              rows={4}
              placeholder="Led a team of 5 engineers…&#10;Reduced load time by 40%…"
            />
          </div>
        ))}
        <button
          onClick={() => addItem('experience', { role: '', company: '', period: '', points: [] })}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <Plus size={14} /> Add position
        </button>
      </SectionCard>

      {/* Projects */}
      <SectionCard title="Projects" defaultOpen={false}>
        {(data.projects ?? []).map((proj, i) => (
          <div key={i} className="bg-zinc-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Project {i + 1}</span>
              <button onClick={() => removeItem('projects', i)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <Input label="Name" value={proj.name} onChange={e => setItem('projects', i, { ...proj, name: e.target.value })} placeholder="My Project" />
            <Input label="Subtitle" value={proj.subtitle} onChange={e => setItem('projects', i, { ...proj, subtitle: e.target.value })} placeholder="npm Package · github.com/…" />
            <Input label="URL (optional)" value={proj.url ?? ''} onChange={e => setItem('projects', i, { ...proj, url: e.target.value })} placeholder="https://…" />
            <Textarea
              label="Bullet points (one per line)"
              value={toLines(proj.points)}
              onChange={e => setItem('projects', i, { ...proj, points: fromLines(e.target.value) })}
              rows={3}
            />
          </div>
        ))}
        <button
          onClick={() => addItem('projects', { name: '', subtitle: '', url: '', points: [] })}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <Plus size={14} /> Add project
        </button>
      </SectionCard>

      {/* Core Skills */}
      <SectionCard title="Core Skills" defaultOpen={false}>
        <Textarea
          label="One skill category per line"
          value={toLines(data.coreSkills)}
          onChange={e => setData(d => ({ ...d, coreSkills: fromLines(e.target.value) }))}
          rows={5}
          placeholder="Frontend: React, TypeScript, Tailwind&#10;Backend: Node.js, Express, MongoDB"
        />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Education" defaultOpen={false}>
        {(data.education ?? []).map((edu, i) => (
          <div key={i} className="bg-zinc-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Degree {i + 1}</span>
              <button onClick={() => removeItem('education', i)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <Input label="Degree" value={edu.degree} onChange={e => setItem('education', i, { ...edu, degree: e.target.value })} placeholder="B.Sc. Computer Science" />
            <Input label="School" value={edu.school} onChange={e => setItem('education', i, { ...edu, school: e.target.value })} placeholder="MIT" />
            <Input label="Period" value={edu.period} onChange={e => setItem('education', i, { ...edu, period: e.target.value })} placeholder="2016 – 2020" />
          </div>
        ))}
        <button
          onClick={() => addItem('education', { degree: '', school: '', period: '' })}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <Plus size={14} /> Add education
        </button>
      </SectionCard>

      {/* Certifications */}
      <SectionCard title="Certifications" defaultOpen={false}>
        <Textarea
          label="One per line"
          value={toLines(data.certifications)}
          onChange={e => setData(d => ({ ...d, certifications: fromLines(e.target.value) }))}
          rows={3}
          placeholder="AWS Certified Solutions Architect&#10;Google Cloud Professional"
        />
      </SectionCard>

      {/* Awards */}
      <SectionCard title="Awards & Recognition" defaultOpen={false}>
        {(data.awards ?? []).map((award, i) => (
          <div key={i} className="bg-zinc-800/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Award {i + 1}</span>
              <button onClick={() => removeItem('awards', i)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <Input label="Title" value={award.title} onChange={e => setItem('awards', i, { ...award, title: e.target.value })} />
            <Input label="Organisation" value={award.org} onChange={e => setItem('awards', i, { ...award, org: e.target.value })} />
            <Textarea label="Description" value={award.description} onChange={e => setItem('awards', i, { ...award, description: e.target.value })} rows={2} />
          </div>
        ))}
        <button
          onClick={() => addItem('awards', { title: '', org: '', description: '' })}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <Plus size={14} /> Add award
        </button>
      </SectionCard>

      {/* Footer note */}
      <SectionCard title="Footer Note" defaultOpen={false}>
        <Textarea
          value={data.footerNote ?? ''}
          onChange={e => setData(d => ({ ...d, footerNote: e.target.value }))}
          rows={2}
          placeholder="Self-taught engineer — expertise demonstrated through…"
        />
      </SectionCard>

      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

// ── Tailor Section ────────────────────────────────────────────────────────────

function TailorSection() {
  const [jd, setJd] = useState('')
  const [tailored, setTailored] = useState(null)
  const [tailoring, setTailoring] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const tailor = async () => {
    if (!jd.trim()) return
    setTailoring(true)
    setTailored(null)
    try {
      const { data } = await api.post('/cv/tailor', { jd })
      setTailored(data.tailored)
    } catch (err) {
      alert(err.response?.data?.message || 'Tailoring failed. Set up your CV profile first.')
    } finally {
      setTailoring(false)
    }
  }

  const downloadPdf = async () => {
    if (!tailored) return
    setDownloading(true)
    try {
      const { data } = await api.post('/cv/pdf', { resume: tailored }, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Tailored_Resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF download failed')
    } finally {
      setDownloading(false)
    }
  }

  const downloadMaster = async () => {
    setDownloading(true)
    try {
      const { data } = await api.get('/cv/resume.pdf', { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.response?.data?.message || 'PDF download failed. Save your CV profile first.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-xl font-bold text-zinc-50 mb-4">Tailor & Download</h2>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-5">
        <h3 className="font-semibold text-zinc-100 text-sm mb-3 flex items-center gap-2">
          <Download size={16} /> Master Resume PDF
        </h3>
        <button
          onClick={downloadMaster}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-200 rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Download PDF
        </button>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-5">
        <h3 className="font-semibold text-zinc-100 text-sm mb-3 flex items-center gap-2">
          <Wand2 size={16} /> AI Tailor for Job Description
        </h3>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the job description here…"
          rows={7}
          className="w-full bg-zinc-800 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono mb-3"
        />
        <button
          onClick={tailor}
          disabled={tailoring || !jd.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {tailoring ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {tailoring ? 'Tailoring with AI…' : 'Tailor CV'}
        </button>
      </div>

      {tailored && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" /> Tailored Preview
            </h3>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </button>
          </div>
          <div className="bg-zinc-950 rounded-xl p-4 text-sm text-zinc-200 space-y-3 max-h-80 overflow-auto">
            <p className="font-semibold text-zinc-50">{tailored.header?.name} · {tailored.header?.title}</p>
            {tailored.summary?.map((p, i) => <p key={i} className="text-zinc-300 text-xs">{p}</p>)}
            {tailored.experience?.slice(0, 2).map((exp, i) => (
              <div key={i}>
                <p className="font-medium text-xs">{exp.role} — {exp.company}</p>
                <ul className="list-disc pl-4 text-xs text-zinc-400 space-y-0.5">
                  {exp.points?.slice(0, 3).map((pt, j) => <li key={j}>{pt}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CVManager() {
  const { setCvReady } = useOutletContext() ?? {}
  const [view, setView] = useState('loading')
  const [cvData, setCvData] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.get('/cv')
      .then(r => {
        if (r.data.profileData) {
          setCvData(r.data.profileData)
          setView('editor')
        } else {
          setView('template')
        }
      })
      .catch(() => setView('template'))
  }, [])

  const loadTemplate = async (id) => {
    try {
      const { data } = await api.get(`/cv-templates/${id}`)
      setCvData(data.data)
      setView('editor')
    } catch {
      alert('Failed to load template')
    }
  }

  const handleUpload = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('cv', file)
      const { data } = await api.post('/cv/upload', fd)
      if (data.profileData) {
        setCvData(data.profileData)
        setView('editor')
      } else {
        setCvData(BLANK_PROFILE)
        setView('editor')
        alert('Could not auto-parse the CV — please fill in your details manually.')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (view === 'loading') {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    )
  }

  if (view === 'template') {
    return (
      <div className="p-8">
        <TemplatePicker
          onSelect={loadTemplate}
          onManual={() => { setCvData(BLANK_PROFILE); setView('editor') }}
        />
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">Or import from a PDF / DOCX file (text will be stored for reference):</p>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium transition disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload CV file'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">CV Manager</h1>
        <div className="flex border border-zinc-700/60 rounded-xl overflow-hidden">
          {[['profile', 'Edit Profile'], ['tailor', 'Tailor & Download']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-1.5 text-sm font-medium transition ${activeTab === key ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setView('template')}
          className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          <LayoutTemplate size={13} /> Change template
        </button>
      </div>

      {activeTab === 'profile'
        ? <ProfileEditor initial={cvData} onSaved={d => { setCvData(d); setCvReady?.(true) }} />
        : <TailorSection />
      }
    </div>
  )
}
