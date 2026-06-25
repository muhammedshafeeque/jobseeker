import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { Loader2 } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const features = [
  { icon: '📄', title: 'Smart CV Manager', desc: 'Upload your CV — AI structures it into a polished profile instantly' },
  { icon: '🎯', title: 'AI Resume Tailoring', desc: 'Tailor your resume to any job description in seconds with Groq AI' },
  { icon: '📊', title: 'Job Application Tracker', desc: 'Track every application with status, notes, and follow-ups' },
  { icon: '📧', title: 'Gmail Integration', desc: 'Auto-detect job emails and surface opportunities from your inbox' },
]

export default function Login() {
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (params.get('error')) setError('Sign-in failed. Please try again.')
  }, [])

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/auth/google', {
        params: { _: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      })
      window.location.href = data.url
    } catch {
      setError('Failed to start sign-in. Is the server running?')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex overflow-hidden relative">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" style={{ animation: 'blob1 12s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[120px]" style={{ animation: 'blob2 15s ease-in-out infinite' }} />
        <div className="absolute -bottom-32 right-0 w-[450px] h-[450px] rounded-full bg-indigo-600/15 blur-[120px]" style={{ animation: 'blob3 10s ease-in-out infinite' }} />
      </div>

      {/* Dot grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* ── Left panel ───────────────────────────────────── */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between px-16 py-14 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/40">
            📬
          </div>
          <span className="text-white font-bold text-lg tracking-tight">JobDesk</span>
        </div>

        {/* Hero text */}
        <div className="-mt-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-xs font-medium">Personal AI-powered workspace</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-5">
            Your job search,<br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              supercharged.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            One place to manage your CV, track applications, and let AI do the heavy lifting.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-5">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-base shrink-0 group-hover:border-blue-500/40 transition">
                  {icon}
                </div>
                <div>
                  <p className="text-zinc-100 font-semibold text-sm">{title}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-zinc-700 text-xs">Private access only · Built for personal use</p>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-blue-500/30">📬</div>
            <h1 className="text-2xl font-bold text-white">JobDesk</h1>
            <p className="text-zinc-400 text-sm mt-1">Your personal job search command centre</p>
          </div>

          {/* Card */}
          <div className="relative">
            {/* Card glow border */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-zinc-600/60 to-zinc-800/20" />
            <div className="relative bg-zinc-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
                <p className="text-zinc-400 text-sm">Sign in to your workspace to continue</p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700/50 text-red-300 rounded-2xl px-4 py-3 text-sm mb-5 flex items-center gap-2">
                  <span className="text-red-400">⚠</span> {error}
                </div>
              )}

              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full group relative flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin text-zinc-500" />
                  : <GoogleIcon />
                }
                <span>{loading ? 'Redirecting to Google…' : 'Continue with Google'}</span>
                {!loading && (
                  <span className="absolute right-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform">→</span>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-zinc-800">
                <p className="text-center text-zinc-600 text-xs leading-relaxed">
                  Private workspace · Access restricted to authorised accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(60px, 40px) scale(1.1); }
          66%       { transform: translate(-40px, 60px) scale(0.9); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-50px, -60px) scale(1.08); }
          66%       { transform: translate(40px, 30px) scale(0.92); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-30px, -50px) scale(1.06); }
          66%       { transform: translate(50px, 20px) scale(0.94); }
        }
      `}</style>
    </div>
  )
}
