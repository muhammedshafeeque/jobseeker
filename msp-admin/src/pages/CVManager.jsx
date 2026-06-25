import { useEffect, useRef, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Upload, Wand2, Download, FileText, Loader2, CheckCircle, Plus, Trash2,
  ChevronDown, ChevronUp, LayoutTemplate, Pencil, X, Save, RefreshCw,
} from 'lucide-react'
import api from '../lib/api'

// ── Tiny helpers ──────────────────────────────────────────────────────────────

const inp = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600'
const inpMono = `${inp} font-mono`

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs text-zinc-500 block mb-1">{label}</label>}
    <input {...props} className={inp} />
  </div>
)

const Textarea = ({ label, rows = 4, ...props }) => (
  <div>
    {label && <label className="text-xs text-zinc-500 block mb-1">{label}</label>}
    <textarea rows={rows} {...props} className={`${inp} resize-none`} />
  </div>
)

const btn = {
  primary: 'flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition disabled:opacity-40',
  ghost: 'flex items-center gap-2 px-4 py-2 border border-zinc-800 text-zinc-400 rounded-xl text-sm hover:bg-zinc-900 hover:text-zinc-200 transition disabled:opacity-40',
  sm: 'flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-800 hover:border-zinc-700 transition disabled:opacity-40',
  add: 'flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition mt-1',
  del: 'text-zinc-600 hover:text-zinc-400 transition',
}

const SectionCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/40 transition">
        <span className="font-medium text-zinc-200 text-sm">{title}</span>
        {open ? <ChevronUp size={15} className="text-zinc-600" /> : <ChevronDown size={15} className="text-zinc-600" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  )
}

const toLines = arr => (arr ?? []).join('\n')
const fromLines = text => text.split('\n').map(s => s.trim()).filter(Boolean)

const getFilename = (response, fallback) => {
  const d = response.headers?.['content-disposition'] ?? ''
  return d.match(/filename="([^"]+)"/)?.[1] ?? fallback
}
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

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
        <h2 className="text-xl font-semibold text-zinc-100 mb-1.5">Set up your CV</h2>
        <p className="text-zinc-500 text-sm">Start from a template or build from scratch.</p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm"><Loader2 size={15} className="animate-spin"/> Loading templates…</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          {templates.map(t => (
            <button key={t._id} onClick={() => onSelect(t._id)}
              className="text-left p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-600 transition group">
              <div className="w-8 h-8 bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
                <LayoutTemplate size={15} className="text-zinc-400"/>
              </div>
              <p className="font-medium text-zinc-200 text-sm group-hover:text-zinc-100">{t.name}</p>
              <p className="text-xs text-zinc-600 mt-1">{t.description}</p>
              <span className="inline-block mt-2 text-xs bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-lg px-2 py-0.5">{t.category}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={onManual} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition">
        <Pencil size={13}/> Start with a blank profile
      </button>
    </div>
  )
}

// ── Profile Editor ────────────────────────────────────────────────────────────

const BLANK_PROFILE = {
  header: { name: '', title: '', email: '', phone: '', links: [] },
  summary: [], experience: [], projects: [], coreSkills: [],
  awards: [], certifications: [], education: [], footerNote: '',
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
  const setItem = (key, idx, value) => setData(d => { const arr = [...(d[key] ?? [])]; arr[idx] = value; return { ...d, [key]: arr } })

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/cv/profile', data)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      onSaved?.(data)
    } catch (err) { alert(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-zinc-100">Edit Profile</h2>
        <button onClick={save} disabled={saving} className={btn.primary}>
          {saving ? <Loader2 size={13} className="animate-spin"/> : saved ? <CheckCircle size={13}/> : <Save size={13}/>}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Profile'}
        </button>
      </div>

      <SectionCard title="Personal Details">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" value={data.header.name} onChange={e => set('header.name', e.target.value)} placeholder="Jane Smith"/>
          <Input label="Job Title" value={data.header.title} onChange={e => set('header.title', e.target.value)} placeholder="Senior Software Engineer"/>
          <Input label="Email" type="email" value={data.header.email} onChange={e => set('header.email', e.target.value)} placeholder="jane@email.com"/>
          <Input label="Phone" value={data.header.phone} onChange={e => set('header.phone', e.target.value)} placeholder="+1 555-000-0000"/>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-2">Links</label>
          {(data.header.links ?? []).map((link, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select value={link.icon} onChange={e => { const a=[...data.header.links]; a[i]={...a[i],icon:e.target.value}; set('header.links',a) }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none">
                {['linkedin','github','npm','medium','web'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input value={link.url} onChange={e => { const a=[...data.header.links]; a[i]={...a[i],url:e.target.value}; set('header.links',a) }}
                placeholder="https://…" className={`${inp} flex-1`}/>
              <button onClick={() => set('header.links', data.header.links.filter((_,j)=>j!==i))} className={btn.del}><X size={14}/></button>
            </div>
          ))}
          <button onClick={() => set('header.links', [...(data.header.links??[]),{icon:'linkedin',url:''}])} className={btn.add}>
            <Plus size={12}/> Add link
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Professional Summary">
        <Textarea label="One paragraph per line" value={toLines(data.summary)}
          onChange={e => setData(d => ({ ...d, summary: fromLines(e.target.value) }))} rows={5}
          placeholder="Results-driven engineer with 5+ years…&#10;Second paragraph…"/>
      </SectionCard>

      <SectionCard title="Work Experience">
        {(data.experience ?? []).map((exp, i) => (
          <div key={i} className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">Position {i+1}</span>
              <button onClick={() => removeItem('experience',i)} className={btn.del}><Trash2 size={13}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Job Title" value={exp.role} onChange={e => setItem('experience',i,{...exp,role:e.target.value})} placeholder="Senior Engineer"/>
              <Input label="Company" value={exp.company} onChange={e => setItem('experience',i,{...exp,company:e.target.value})} placeholder="Acme Corp"/>
            </div>
            <Input label="Period" value={exp.period} onChange={e => setItem('experience',i,{...exp,period:e.target.value})} placeholder="Jan 2022 – Present"/>
            <Textarea label="Bullet points (one per line)" value={toLines(exp.points)}
              onChange={e => setItem('experience',i,{...exp,points:fromLines(e.target.value)})} rows={4}
              placeholder="Led a team of 5 engineers…&#10;Reduced load time by 40%…"/>
          </div>
        ))}
        <button onClick={() => addItem('experience',{role:'',company:'',period:'',points:[]})} className={btn.add}>
          <Plus size={12}/> Add position
        </button>
      </SectionCard>

      <SectionCard title="Projects" defaultOpen={false}>
        {(data.projects ?? []).map((proj, i) => (
          <div key={i} className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">Project {i+1}</span>
              <button onClick={() => removeItem('projects',i)} className={btn.del}><Trash2 size={13}/></button>
            </div>
            <Input label="Name" value={proj.name} onChange={e => setItem('projects',i,{...proj,name:e.target.value})} placeholder="My Project"/>
            <Input label="Subtitle" value={proj.subtitle} onChange={e => setItem('projects',i,{...proj,subtitle:e.target.value})} placeholder="npm Package · github.com/…"/>
            <Input label="URL (optional)" value={proj.url??''} onChange={e => setItem('projects',i,{...proj,url:e.target.value})} placeholder="https://…"/>
            <Textarea label="Bullet points (one per line)" value={toLines(proj.points)}
              onChange={e => setItem('projects',i,{...proj,points:fromLines(e.target.value)})} rows={3}/>
          </div>
        ))}
        <button onClick={() => addItem('projects',{name:'',subtitle:'',url:'',points:[]})} className={btn.add}>
          <Plus size={12}/> Add project
        </button>
      </SectionCard>

      <SectionCard title="Core Skills" defaultOpen={false}>
        <Textarea label="One category per line" value={toLines(data.coreSkills)}
          onChange={e => setData(d => ({ ...d, coreSkills: fromLines(e.target.value) }))} rows={5}
          placeholder="Frontend: React, TypeScript, Tailwind&#10;Backend: Node.js, Express, MongoDB"/>
      </SectionCard>

      <SectionCard title="Education" defaultOpen={false}>
        {(data.education ?? []).map((edu, i) => (
          <div key={i} className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">Degree {i+1}</span>
              <button onClick={() => removeItem('education',i)} className={btn.del}><Trash2 size={13}/></button>
            </div>
            <Input label="Degree" value={edu.degree} onChange={e => setItem('education',i,{...edu,degree:e.target.value})} placeholder="B.Sc. Computer Science"/>
            <Input label="School" value={edu.school} onChange={e => setItem('education',i,{...edu,school:e.target.value})} placeholder="MIT"/>
            <Input label="Period" value={edu.period} onChange={e => setItem('education',i,{...edu,period:e.target.value})} placeholder="2016 – 2020"/>
          </div>
        ))}
        <button onClick={() => addItem('education',{degree:'',school:'',period:''})} className={btn.add}>
          <Plus size={12}/> Add education
        </button>
      </SectionCard>

      <SectionCard title="Certifications" defaultOpen={false}>
        <Textarea label="One per line" value={toLines(data.certifications)}
          onChange={e => setData(d => ({ ...d, certifications: fromLines(e.target.value) }))} rows={3}
          placeholder="AWS Certified Solutions Architect&#10;Google Cloud Professional"/>
      </SectionCard>

      <SectionCard title="Awards & Recognition" defaultOpen={false}>
        {(data.awards ?? []).map((award, i) => (
          <div key={i} className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">Award {i+1}</span>
              <button onClick={() => removeItem('awards',i)} className={btn.del}><Trash2 size={13}/></button>
            </div>
            <Input label="Title" value={award.title} onChange={e => setItem('awards',i,{...award,title:e.target.value})}/>
            <Input label="Organisation" value={award.org} onChange={e => setItem('awards',i,{...award,org:e.target.value})}/>
            <Textarea label="Description" value={award.description} onChange={e => setItem('awards',i,{...award,description:e.target.value})} rows={2}/>
          </div>
        ))}
        <button onClick={() => addItem('awards',{title:'',org:'',description:''})} className={btn.add}>
          <Plus size={12}/> Add award
        </button>
      </SectionCard>

      <SectionCard title="Footer Note" defaultOpen={false}>
        <Textarea value={data.footerNote??''} onChange={e => setData(d => ({ ...d, footerNote: e.target.value }))} rows={2}
          placeholder="Self-taught engineer — expertise demonstrated through…"/>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <button onClick={save} disabled={saving} className={btn.primary}>
          {saving ? <Loader2 size={13} className="animate-spin"/> : saved ? <CheckCircle size={13}/> : <Save size={13}/>}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

// ── ATS Score + Generate Section ──────────────────────────────────────────────

function AtsSection({ onProfileUpdated }) {
  const fileRef = useRef()
  const [mode, setMode] = useState('profile') // 'profile' | 'file'
  const [jd, setJd] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(null)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const analyze = async () => {
    if (!jd.trim()) return
    if (mode === 'file' && !cvFile) return
    setLoading(true); setResult(null); setGenerated(null)
    try {
      let data
      if (mode === 'file') {
        const fd = new FormData()
        fd.append('cv', cvFile)
        fd.append('jd', jd)
        ;({ data } = await api.post('/cv/ats-score/file', fd))
      } else {
        ;({ data } = await api.post('/cv/ats-score', { jd }))
      }
      setResult(data)
    } catch (err) { alert(err.response?.data?.message || 'Analysis failed') }
    finally { setLoading(false) }
  }

  const generateAts = async () => {
    setGenerating(true); setGenerated(null)
    try {
      const { data } = await api.post('/cv/ats-friendly', { jd })
      setGenerated(data.profileData)
    } catch (err) { alert(err.response?.data?.message || 'Generation failed. Make sure you have a saved profile.') }
    finally { setGenerating(false) }
  }

  const saveGenerated = async () => {
    if (!generated) return
    setSaving(true)
    try {
      await api.post('/cv/profile', generated)
      onProfileUpdated?.(generated)
      alert('Profile updated with ATS-optimized version.')
    } catch { alert('Save failed') }
    finally { setSaving(false) }
  }

  const downloadGenerated = async () => {
    if (!generated) return
    setDownloading(true)
    try {
      const response = await api.post('/cv/pdf', { resume: generated }, { responseType: 'blob' })
      triggerDownload(response.data, getFilename(response, 'ATS_Resume.pdf'))
    } catch { alert('PDF download failed') }
    finally { setDownloading(false) }
  }

  const score = result?.score ?? 0
  const circumference = 100
  const filled = (score / 100) * circumference

  return (
    <div className="max-w-3xl space-y-5">
      <h2 className="text-xl font-semibold text-zinc-100">ATS Score Checker</h2>

      {/* Mode toggle */}
      <div className="flex border border-zinc-800 rounded-xl overflow-hidden w-fit">
        {[['profile','Use Saved Profile'],['file','Upload a PDF']].map(([m,l]) => (
          <button key={m} onClick={() => { setMode(m); setResult(null); setGenerated(null); setCvFile(null) }}
            className={`px-4 py-2 text-sm font-medium transition ${mode===m ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* File drop zone */}
      {mode === 'file' && (
        <div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
            onChange={e => { setCvFile(e.target.files[0] || null); e.target.value = '' }}/>
          <button onClick={() => fileRef.current.click()}
            className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition ${
              cvFile ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'
            }`}>
            {cvFile
              ? <p className="text-sm text-zinc-200"><FileText size={14} className="inline mr-1.5"/>{cvFile.name}</p>
              : <div className="space-y-1">
                  <Upload size={18} className="mx-auto text-zinc-600"/>
                  <p className="text-sm text-zinc-500">Click to select PDF or DOCX</p>
                  <p className="text-xs text-zinc-700">Max 5 MB</p>
                </div>
            }
          </button>
          {cvFile && <button onClick={() => setCvFile(null)} className="mt-1 text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1"><X size={10}/> Remove</button>}
        </div>
      )}

      {/* JD + analyze */}
      <div className="space-y-3">
        <label className="text-xs text-zinc-500">Job Description *</label>
        <textarea value={jd} onChange={e => setJd(e.target.value)}
          placeholder="Paste the job description here…" rows={7}
          className={`${inpMono} resize-none`}/>
        <button onClick={analyze}
          disabled={loading || !jd.trim() || (mode==='file' && !cvFile)}
          className={btn.primary}>
          {loading ? <><Loader2 size={14} className="animate-spin"/> Analysing…</> : 'Analyse'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Score ring */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-6">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3" strokeDasharray={`${(score/100)*100} 100`}
                  strokeLinecap="round" pathLength="100"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{score}</span>
              </div>
            </div>
            <div>
              <p className={`text-lg font-semibold ${score >= 75 ? 'text-emerald-300' : score >= 50 ? 'text-amber-300' : 'text-red-400'}`}>{result.verdict}</p>
              <p className="text-xs text-zinc-500 mt-0.5">ATS Match Score</p>
            </div>
          </div>

          {/* Keywords */}
          <div className="grid sm:grid-cols-2 gap-4">
            {result.matchedKeywords?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-2">✓ Matched keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((k,i) => (
                    <span key={i} className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs px-2 py-0.5 rounded-lg">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {result.missingKeywords?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-red-500 font-medium uppercase tracking-wider mb-2">✗ Missing keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((k,i) => (
                    <span key={i} className="bg-red-950/30 border border-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-lg">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.strengths?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Strengths</p>
              <ul className="space-y-1.5">
                {result.strengths.map((s,i) => <li key={i} className="text-sm text-zinc-300 flex gap-2"><span className="text-emerald-500 shrink-0">+</span>{s}</li>)}
              </ul>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Suggestions</p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s,i) => <li key={i} className="text-sm text-zinc-400 flex gap-2"><span className="text-indigo-400 shrink-0">→</span>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Generate ATS-friendly */}
          <div className="border border-zinc-800 rounded-2xl p-5 space-y-3 bg-zinc-900/50">
            <div>
              <p className="text-sm font-medium text-zinc-200 mb-0.5">Generate ATS-Optimized CV</p>
              <p className="text-xs text-zinc-500">AI rewrites your saved profile to maximize keyword alignment with this job description.</p>
            </div>
            <button onClick={generateAts} disabled={generating} className={btn.primary}>
              {generating ? <><Loader2 size={14} className="animate-spin"/> Optimizing…</> : <><Wand2 size={14}/> Generate ATS CV</>}
            </button>
          </div>
        </div>
      )}

      {/* Generated preview */}
      {generated && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-zinc-200">ATS-Optimized CV Preview</p>
            <div className="flex gap-2">
              <button onClick={saveGenerated} disabled={saving} className={btn.sm}>
                {saving ? <Loader2 size={11} className="animate-spin"/> : <Save size={11}/>} Save to Profile
              </button>
              <button onClick={downloadGenerated} disabled={downloading} className={btn.sm}>
                {downloading ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>} Download PDF
              </button>
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 max-h-64 overflow-auto text-xs">
            <p className="font-semibold text-zinc-100">{generated.header?.name} · {generated.header?.title}</p>
            {generated.summary?.map((p,i) => <p key={i} className="text-zinc-400 leading-relaxed">{p}</p>)}
            {generated.experience?.slice(0,2).map((exp,i) => (
              <div key={i}>
                <p className="font-medium text-zinc-300">{exp.role} — {exp.company}</p>
                <ul className="mt-1 space-y-0.5 list-disc pl-4 text-zinc-500">
                  {exp.points?.slice(0,3).map((pt,j) => <li key={j}>{pt}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-700">"Save to Profile" will overwrite your current profile (previous version archived in History).</p>
        </div>
      )}
    </div>
  )
}

// ── Interview Prep Section ────────────────────────────────────────────────────

function InterviewPrepSection() {
  const [form, setForm] = useState({ jd: '', company: '', role: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    if (!form.jd.trim()) return
    setLoading(true); setResult(null)
    try { const { data } = await api.post('/cv/interview-prep', form); setResult(data) }
    catch (err) { alert(err.response?.data?.message || 'Generation failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">Interview Prep</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <p className="text-sm text-zinc-500">Get role-specific questions and hints based on your CV.</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Company" value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} placeholder="Google"/>
          <Input label="Role" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} placeholder="Senior Frontend Engineer"/>
        </div>
        <textarea value={form.jd} onChange={e => setForm(f=>({...f,jd:e.target.value}))}
          placeholder="Paste the job description…" rows={6} className={`${inpMono} resize-none`}/>
        <button onClick={run} disabled={loading || !form.jd.trim()} className={btn.primary}>
          {loading ? <><Loader2 size={14} className="animate-spin"/> Generating…</> : 'Generate Prep Pack'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {result.technicalQuestions?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3">Technical</p>
              <div className="space-y-4">
                {result.technicalQuestions.map((q,i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-sm font-medium text-zinc-100">{i+1}. {q.question}</p>
                    <p className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-2 leading-relaxed">{q.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.behavioralQuestions?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3">Behavioral</p>
              <div className="space-y-4">
                {result.behavioralQuestions.map((q,i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-sm font-medium text-zinc-100">{i+1}. {q.question}</p>
                    <p className="text-xs text-zinc-500 bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-2 leading-relaxed">{q.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.questionsToAsk?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Ask the Interviewer</p>
              <ul className="space-y-1.5">
                {result.questionsToAsk.map((q,i) => (
                  <li key={i} className="text-sm text-zinc-400 flex gap-2"><span className="text-zinc-600 shrink-0">→</span>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Cover Letter Section ──────────────────────────────────────────────────────

function CoverLetterSection() {
  const [form, setForm] = useState({ jd: '', company: '', role: '' })
  const [generating, setGenerating] = useState(false)
  const [text, setText] = useState('')
  const [downloading, setDownloading] = useState(false)

  const generate = async () => {
    if (!form.jd.trim()) return
    setGenerating(true); setText('')
    try {
      const { data } = await api.post('/cv/cover-letter/text', form)
      setText(data.body)
    } catch (err) { alert(err.response?.data?.message || 'Generation failed') }
    finally { setGenerating(false) }
  }

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const response = await api.post('/cv/cover-letter/pdf', form, { responseType: 'blob' })
      triggerDownload(response.data, getFilename(response, 'CoverLetter.pdf'))
    } catch { alert('PDF download failed') }
    finally { setDownloading(false) }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">Cover Letter</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Company" value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} placeholder="Stripe"/>
          <Input label="Role" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} placeholder="Software Engineer"/>
        </div>
        <textarea value={form.jd} onChange={e => setForm(f=>({...f,jd:e.target.value}))}
          placeholder="Paste the job description…" rows={5} className={`${inpMono} resize-none`}/>
        <button onClick={generate} disabled={generating || !form.jd.trim()} className={btn.primary}>
          {generating ? <><Loader2 size={14} className="animate-spin"/> Writing…</> : 'Generate Draft'}
        </button>
      </div>

      {text && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Editable Draft</p>
            <button onClick={downloadPdf} disabled={downloading} className={btn.sm}>
              {downloading ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>} Download PDF
            </button>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={18}
            className={`${inp} font-mono resize-none leading-relaxed`}/>
          <p className="text-xs text-zinc-700">PDF uses the original AI-generated version, not your edits.</p>
        </div>
      )}
    </div>
  )
}

// ── History Section ───────────────────────────────────────────────────────────

function HistorySection({ onRestore }) {
  const [versions, setVersions] = useState(null)
  const [restoring, setRestoring] = useState(null)
  const load = () => api.get('/cv/versions').then(r => setVersions(r.data)).catch(() => setVersions([]))
  useEffect(() => { load() }, [])

  const restore = async v => {
    if (!confirm(`Restore version from ${new Date(v.savedAt).toLocaleString()}? Current profile will be archived.`)) return
    setRestoring(v.index)
    try {
      const { data } = await api.post(`/cv/versions/restore/${v.index}`)
      onRestore?.(data.profileData); await load()
      alert('Restored — switch to Profile tab to review.')
    } catch { alert('Restore failed') }
    finally { setRestoring(null) }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">Version History</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <p className="text-xs text-zinc-600 mb-4">Every time you save, the previous version is archived here (last 10).</p>
        {versions === null ? (
          <div className="flex items-center gap-2 text-zinc-600 text-sm"><Loader2 size={14} className="animate-spin"/> Loading…</div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-zinc-600">No saved versions yet.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v, i) => (
              <div key={i} className="flex items-center gap-4 bg-zinc-800/60 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{v.name}</p>
                  <p className="text-xs text-zinc-600">{v.experienceCount} exp · {v.skillCount} skills</p>
                </div>
                <p className="text-xs text-zinc-600 shrink-0">{new Date(v.savedAt).toLocaleString()}</p>
                <button onClick={() => restore(v)} disabled={restoring===v.index} className={btn.sm}>
                  {restoring===v.index ? <Loader2 size={11} className="animate-spin"/> : <RefreshCw size={11}/>} Restore
                </button>
              </div>
            ))}
          </div>
        )}
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
    setTailoring(true); setTailored(null)
    try { const { data } = await api.post('/cv/tailor', { jd }); setTailored(data.tailored) }
    catch (err) { alert(err.response?.data?.message || 'Tailoring failed. Save your CV profile first.') }
    finally { setTailoring(false) }
  }

  const downloadPdf = async () => {
    if (!tailored) return
    setDownloading(true)
    try {
      const response = await api.post('/cv/pdf', { resume: tailored }, { responseType: 'blob' })
      triggerDownload(response.data, getFilename(response, 'Tailored_Resume.pdf'))
    } catch { alert('PDF download failed') }
    finally { setDownloading(false) }
  }

  const downloadMaster = async () => {
    setDownloading(true)
    try {
      const response = await api.get('/cv/resume.pdf', { responseType: 'blob' })
      triggerDownload(response.data, getFilename(response, 'Resume.pdf'))
    } catch (err) { alert(err.response?.data?.message || 'Save your CV profile first.') }
    finally { setDownloading(false) }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-xl font-semibold text-zinc-100">Tailor & Download</h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><Download size={14}/> Master Resume PDF</h3>
        </div>
        <button onClick={downloadMaster} disabled={downloading} className={btn.ghost}>
          {downloading ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>} Download PDF
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><Wand2 size={14}/> AI Tailor for Job</h3>
        <textarea value={jd} onChange={e => setJd(e.target.value)}
          placeholder="Paste the job description here…" rows={7} className={`${inpMono} resize-none`}/>
        <button onClick={tailor} disabled={tailoring || !jd.trim()} className={btn.primary}>
          {tailoring ? <><Loader2 size={14} className="animate-spin"/> Tailoring…</> : <><Wand2 size={14}/> Tailor CV</>}
        </button>
      </div>

      {tailored && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2"><CheckCircle size={14} className="text-zinc-400"/> Tailored Preview</h3>
            <button onClick={downloadPdf} disabled={downloading} className={btn.sm}>
              {downloading ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>} Download PDF
            </button>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 space-y-3 max-h-72 overflow-auto">
            <p className="font-semibold text-zinc-100">{tailored.header?.name} · {tailored.header?.title}</p>
            {tailored.summary?.map((p,i) => <p key={i} className="text-zinc-400 leading-relaxed">{p}</p>)}
            {tailored.experience?.slice(0,2).map((exp,i) => (
              <div key={i}>
                <p className="font-medium">{exp.role} — {exp.company}</p>
                <ul className="list-disc pl-4 text-zinc-500 space-y-0.5 mt-1">
                  {exp.points?.slice(0,3).map((pt,j) => <li key={j}>{pt}</li>)}
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
  const [uploadMsg, setUploadMsg] = useState(null)

  useEffect(() => {
    api.get('/cv')
      .then(r => { if (r.data.profileData) { setCvData(r.data.profileData); setView('editor') } else { setView('template') } })
      .catch(() => setView('template'))
  }, [])

  const notify = (type, text) => { setUploadMsg({ type, text }); setTimeout(() => setUploadMsg(null), 4000) }

  const loadTemplate = async id => {
    try { const { data } = await api.get(`/cv-templates/${id}`); setCvData(data.data); setView('editor') }
    catch { notify('error', 'Failed to load template') }
  }

  const handleUpload = async e => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('cv', file)
      const { data } = await api.post('/cv/upload', fd)
      setCvData(data.profileData ?? BLANK_PROFILE); setCvReady?.(true); setView('editor')
      notify(data.profileData ? 'success' : 'error', data.profileData ? 'CV parsed — review and save.' : 'Could not auto-parse — fill in manually.')
    } catch (err) { notify('error', err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false); e.target.value = '' }
  }

  const fileInput = <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload}/>

  if (view === 'loading') return (
    <div className="p-8 flex items-center gap-2 text-zinc-600 text-sm"><Loader2 size={15} className="animate-spin"/> Loading…</div>
  )

  if (view === 'template') return (
    <div className="p-8">
      {fileInput}
      <TemplatePicker onSelect={loadTemplate} onManual={() => { setCvData(BLANK_PROFILE); setView('editor') }}/>
      <div className="mt-6 pt-6 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 mb-2">Or import from a PDF / DOCX — AI will extract and pre-fill your profile:</p>
        <button onClick={() => fileRef.current.click()} disabled={uploading} className={btn.ghost}>
          {uploading ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
          {uploading ? 'Parsing CV…' : 'Upload PDF / DOCX'}
        </button>
      </div>
    </div>
  )

  const TABS = [['profile','Profile'],['tailor','Tailor'],['ats','ATS Score'],['prep','Interview Prep'],['letter','Cover Letter'],['history','History']]

  return (
    <div className="p-6 lg:p-8">
      {fileInput}

      {uploadMsg && (
        <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm border ${
          uploadMsg.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-red-950/20 border-red-900/50 text-red-400'
        }`}>
          {uploadMsg.type === 'success' ? <CheckCircle size={14}/> : <X size={14}/>} {uploadMsg.text}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-xl font-semibold text-zinc-100">CV Manager</h1>
        <div className="flex border border-zinc-800 rounded-xl overflow-hidden">
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                activeTab === key ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => fileRef.current.click()} disabled={uploading} className={btn.sm}>
            {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>}
            {uploading ? 'Parsing…' : 'Upload PDF'}
          </button>
          <button onClick={() => setView('template')} className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition">
            <LayoutTemplate size={12}/> Templates
          </button>
        </div>
      </div>

      {activeTab === 'profile' && <ProfileEditor initial={cvData} onSaved={d => { setCvData(d); setCvReady?.(true) }}/>}
      {activeTab === 'tailor' && <TailorSection/>}
      {activeTab === 'ats' && <AtsSection onProfileUpdated={d => { setCvData(d); setCvReady?.(true) }}/>}
      {activeTab === 'prep' && <InterviewPrepSection/>}
      {activeTab === 'letter' && <CoverLetterSection/>}
      {activeTab === 'history' && <HistorySection onRestore={d => { setCvData(d); setActiveTab('profile') }}/>}
    </div>
  )
}
