import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { Loader2 } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const features = [
  { icon: '✦', title: 'Smart CV Manager',         desc: 'AI parses your CV instantly into a structured, editable profile',    color: 'from-indigo-500/20 to-indigo-500/5',  border: 'border-indigo-500/20',  text: 'text-indigo-300' },
  { icon: '⬡', title: 'AI Resume Tailoring',      desc: 'Tailor your CV to any job description in seconds with Groq AI',      color: 'from-violet-500/20 to-violet-500/5',  border: 'border-violet-500/20',  text: 'text-violet-300' },
  { icon: '◈', title: 'Job Application Tracker',  desc: 'Kanban board, follow-ups, analytics — everything in one view',       color: 'from-sky-500/20 to-sky-500/5',        border: 'border-sky-500/20',     text: 'text-sky-300'    },
  { icon: '◎', title: 'Gmail Integration',        desc: 'Auto-detect replies and surface opportunities from your inbox',       color: 'from-emerald-500/20 to-emerald-500/5',border: 'border-emerald-500/20', text: 'text-emerald-300'},
]

const stats = [
  { value: 'ATS', sub: 'Score Checker', accent: 'text-indigo-400' },
  { value: 'AI',  sub: 'CV Generation', accent: 'text-violet-400' },
  { value: '∞',   sub: 'Applications',  accent: 'text-sky-400'    },
]

const tickers = [
  'ATS score · CV tailoring · Interview prep',
  'Gmail sync · Job tracker · Analytics',
  'Cover letters · Version history · Kanban',
]

export default function Login() {
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (params.get('error')) setError('Sign-in failed. Please try again.')
    const t = setInterval(() => setTick(n => n + 1), 3500)
    return () => clearInterval(t)
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
    <div className="min-h-screen bg-[#080810] flex overflow-hidden relative select-none">

      {/* ── Fine grid ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      {/* ── Radial glow center ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 25% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />

      {/* ── Animated color orbs ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Indigo orb — top-left */}
        <div className="absolute w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)',
            top: '-25%', left: '-15%',
            animation: 'orb1 22s ease-in-out infinite',
          }} />
        {/* Violet orb — bottom-right */}
        <div className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)',
            bottom: '-15%', right: '0%',
            animation: 'orb2 28s ease-in-out infinite',
          }} />
        {/* Sky accent — mid-right */}
        <div className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
            top: '30%', right: '20%',
            animation: 'orb3 18s ease-in-out infinite',
          }} />
      </div>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between px-20 py-16 relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center backdrop-blur-sm">
              <span className="text-base text-indigo-300">⬡</span>
            </div>
            <div className="absolute -inset-1 rounded-xl bg-indigo-500/10 blur-sm -z-10" />
          </div>
          <span className="font-semibold text-base tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            velayillay.online
          </span>
        </div>

        {/* Main hero */}
        <div className="space-y-8">

          {/* Label chip */}
          <div className="inline-flex items-center gap-2.5 border border-indigo-500/20 rounded-full px-4 py-1.5 bg-indigo-500/5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
            </span>
            <span className="text-indigo-300/70 text-xs tracking-wide">Personal AI workspace · Private access</span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-6xl font-bold leading-[1.05] tracking-tight">
              <span className="text-white">Your job search,</span>
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-white/20 to-white/10 bg-clip-text text-transparent">supercharged</span>
                <span className="absolute left-0 top-0 overflow-hidden whitespace-nowrap bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent"
                  style={{ animation: 'reveal 1.2s ease forwards 0.3s', width: 0 }}>supercharged</span>
              </span>
              <span className="text-white">.</span>
            </h1>
            <p className="text-white/40 text-lg mt-5 leading-relaxed max-w-sm">
              AI that reads, writes, and tracks — so you can focus on landing the offer.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8">
            {stats.map(s => (
              <div key={s.value}>
                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            {features.map(({ icon, title, desc, color, border, text }, i) => (
              <div key={title} className="flex items-start gap-4 group"
                style={{ animation: `fadeUp 0.5s ease forwards ${0.1 * i + 0.2}s`, opacity: 0 }}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-b ${color} border ${border} flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110`}>
                  <span className={`${text} text-sm`}>{icon}</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-white/85 font-medium text-sm">{title}</p>
                  <p className="text-white/35 text-xs leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/15 text-xs">velayillay.online · Built for personal use</p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">

        {/* Separator */}
        <div className="hidden lg:block absolute left-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />

        <div className="w-full max-w-[360px] space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl text-indigo-300">⬡</span>
            </div>
            <h1 className="text-2xl font-bold text-white">velayillay.online</h1>
            <p className="text-white/40 text-sm mt-1">Your personal AI job workspace</p>
          </div>

          {/* Card */}
          <div className="relative" style={{ animation: 'fadeUp 0.6s ease forwards', opacity: 0 }}>
            {/* Gradient border glow */}
            <div className="absolute -inset-px rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 50%, rgba(56,189,248,0.3) 100%)' }} />

            <div className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(10,10,20,0.95) 60%)',
                backdropFilter: 'blur(40px)',
              }}>

              {/* Inner top highlight */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
              {/* Inner bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 100%)' }} />

              <div className="p-8 relative">
                {/* Header */}
                <div className="mb-7">
                  <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
                  <p className="text-white/40 text-sm">Sign in to continue to your workspace</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2.5 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-red-300/80 bg-red-500/5">
                    <span className="text-red-400">⚠</span> {error}
                  </div>
                )}

                {/* Google button */}
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full group relative flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg shadow-black/20"
                  style={{ background: 'rgba(255,255,255,0.96)', color: '#111' }}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                  <div className="absolute inset-0 scale-95 bg-white/10 opacity-0 group-active:opacity-100 transition-all duration-75 rounded-xl" />

                  {loading
                    ? <Loader2 size={17} className="animate-spin text-zinc-500" />
                    : <GoogleIcon />
                  }
                  <span className="font-semibold text-zinc-800">
                    {loading ? 'Redirecting…' : 'Continue with Google'}
                  </span>
                  {!loading && (
                    <span className="absolute right-4 text-zinc-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-xs">→</span>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                  <span className="text-indigo-300/25 text-xs">restricted access</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5 justify-center mb-5">
                  {['ATS Score', 'CV Tailor', 'Job Tracker', 'Gmail Sync'].map((f, i) => (
                    <span key={f} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      ['bg-indigo-950/50 border-indigo-500/20 text-indigo-400',
                       'bg-violet-950/50 border-violet-500/20 text-violet-400',
                       'bg-sky-950/50 border-sky-500/20 text-sky-400',
                       'bg-emerald-950/50 border-emerald-500/20 text-emerald-400'][i]
                    }`}>{f}</span>
                  ))}
                </div>

                {/* Footer note */}
                <p className="text-center text-white/20 text-xs leading-relaxed">
                  Only pre-authorised Google accounts can sign in.
                </p>
              </div>
            </div>
          </div>

          {/* Rotating ticker */}
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-300/30">
            <span className="w-1 h-1 rounded-full bg-indigo-500/40" />
            <span className="tabular-nums transition-all duration-500" key={tick}>
              {tickers[tick % tickers.length]}
            </span>
            <span className="w-1 h-1 rounded-full bg-indigo-500/40" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(80px,60px) scale(1.12); }
          70%      { transform: translate(-40px,80px) scale(0.9); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35%      { transform: translate(-70px,-50px) scale(1.1); }
          65%      { transform: translate(60px,40px) scale(0.92); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-40px,30px) scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes reveal {
          from { width: 0; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
