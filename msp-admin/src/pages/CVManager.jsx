import { useEffect, useRef, useState } from 'react'
import { Upload, Wand2, Download, FileText, Loader2, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { downloadResumePdf } from '../lib/resumePdf'

export default function CVManager() {
  const [cv, setCv] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [jd, setJd] = useState('')
  const [tailored, setTailored] = useState(null)
  const [tailoring, setTailoring] = useState(false)
  const [uploadOk, setUploadOk] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api.get('/cv').then(r => setCv(r.data)).catch(() => {})
  }, [])

  const handleUpload = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadOk(false)
    try {
      const fd = new FormData()
      fd.append('cv', file)
      const { data } = await api.post('/cv/upload', fd)
      setCv(data)
      setUploadOk(true)
      setTimeout(() => setUploadOk(false), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const tailor = async () => {
    if (!jd.trim()) return
    setTailoring(true)
    setTailored(null)
    try {
      const { data } = await api.post('/cv/tailor', { jd })
      setTailored(data.tailored)
    } catch (err) {
      alert(err.response?.data?.message || 'Tailoring failed')
    } finally {
      setTailoring(false)
    }
  }

  const downloadPDF = async () => {
    if (!tailored) return
    setDownloading(true)
    try {
      await downloadResumePdf({ resume: tailored, filename: 'Tailored_Resume.pdf' })
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
      a.download = 'Muhammed_Shafeeque_Resume.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-zinc-50 mb-6">CV Manager</h1>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-6 mb-6">
        <h2 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <FileText size={18} /> Master Resume (Portfolio design)
        </h2>
        <p className="text-zinc-400 text-sm mb-4">
          Tailoring uses your canonical portfolio resume — same PDF design everywhere. Only bullet order and wording change per JD.
        </p>
        <button
          onClick={downloadMaster}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 hover:bg-zinc-950 text-zinc-200 rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Download full resume PDF
        </button>

        {cv && (
          <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-xl mt-4">
            <FileText size={20} className="text-blue-400" />
            <div className="flex-1">
              <p className="font-medium text-zinc-100 text-sm">{cv.fileName}</p>
              <p className="text-xs text-zinc-400">Reference upload · {new Date(cv.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 mt-3 border border-zinc-700/60 hover:bg-zinc-950 text-zinc-300 rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : uploadOk ? <CheckCircle size={16} /> : <Upload size={16} />}
          {uploading ? 'Uploading…' : uploadOk ? 'Uploaded!' : 'Upload reference CV (optional)'}
        </button>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-6 mb-6">
        <h2 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Wand2 size={18} /> Tailor for Job Description
        </h2>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          placeholder="Paste the job description here…"
          rows={8}
          className="w-full border border-zinc-700/60 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono mb-4"
        />
        <button
          onClick={tailor}
          disabled={tailoring || !jd.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
        >
          {tailoring ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {tailoring ? 'Tailoring with AI…' : 'Tailor CV'}
        </button>
      </div>

      {tailored && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" /> Tailored CV Preview
            </h2>
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
          </div>
          <div className="bg-zinc-950 rounded-xl p-4 text-sm text-zinc-200 space-y-3 max-h-[600px] overflow-auto">
            <p className="font-semibold text-zinc-50">{tailored.header?.name} · {tailored.header?.title}</p>
            {tailored.summary?.map((p, i) => <p key={i}>{p}</p>)}
            {tailored.experience?.slice(0, 2).map((exp, i) => (
              <div key={i}>
                <p className="font-medium">{exp.role} — {exp.company}</p>
                <ul className="list-disc pl-5 text-xs text-zinc-300">
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
