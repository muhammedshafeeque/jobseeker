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
  { icon: '✦', title: 'Smart CV Manager', desc: 'AI parses your CV instantly into a structured, editable profile' },
  { icon: '⬡', title: 'AI Resume Tailoring', desc: 'Tailor your CV to any job description in seconds with Groq AI' },
  { icon: '◈', title: 'Job Application Tracker', desc: 'Kanban board, follow-ups, analytics — everything in one view' },
  { icon: '◎', title: 'Gmail Integration', desc: 'Auto-detect replies and surface opportunities from your inbox' },
]

// Animated terminal-style stat
const stats = [
  { value: 'ATS', sub: 'Score Checker' },
  { value: 'AI', sub: 'CV Generation' },
  { value: '∞', sub: 'Applications' },
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
    <div className="min-h-screen bg-[#0a0a0a] flex overflow-hidden relative select-none">

      {/* ── Background layers ─────────────────────────────── */}

      {/* Fine grid */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Radial vignette */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />

      {/* Animated glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', top: '-20%', left: '-10%', animation: 'orb1 20s ease-in-out infinite' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', bottom: '-10%', right: '5%', animation: 'orb2 25s ease-in-out infinite' }} />
      </div>

      {/* ── Left panel ───────────────────────────────────── */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between px-20 py-16 relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
              <span className="text-base">⬡</span>
            </div>
            <div className="absolute -inset-1 rounded-xl bg-white/5 blur-sm -z-10" />
          </div>
          <span className="text-white/90 font-semibold text-base tracking-tight">velayillay.online</span>
        </div>

        {/* Main hero */}
        <div className="space-y-8">

          {/* Label chip */}
          <div className="inline-flex items-center gap-2.5 border border-white/10 rounded-full px-4 py-1.5 bg-white/[0.03] backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/80" />
            </span>
            <span className="text-white/50 text-xs tracking-wide">Personal AI workspace · Private access</span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-6xl font-bold leading-[1.05] tracking-tight">
              <span className="text-white">Your job search,</span>
              <br />
              <span className="relative">
                <span className="text-white/30">supercharged</span>
                <span className="absolute left-0 top-0 text-white overflow-hidden whitespace-nowrap" style={{ animation: 'reveal 1.2s ease forwards 0.3s', width: 0 }}>supercharged</span>
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
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <div className="space-y-4 pt-2 border-t border-white/[0.06]">
            {features.map(({ icon, title, desc }, i) => (
              <div key={title} className="flex items-start gap-4 group" style={{ animation: `fadeUp 0.5s ease forwards ${0.1 * i}s`, opacity: 0 }}>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/50 text-sm shrink-0 group-hover:bg-white/[0.08] group-hover:border-white/20 group-hover:text-white/80 transition-all duration-300">
                  {icon}
                </div>
                <div className="pt-0.5">
                  <p className="text-white/80 font-medium text-sm">{title}</p>
                  <p className="text-white/35 text-xs leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/15 text-xs">velayillay.online · Built for personal use</p>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">

        {/* Subtle vertical separator */}
        <div className="hidden lg:block absolute left-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="w-full max-w-[360px] space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-xl">⬡</div>
            <h1 className="text-2xl font-bold text-white">velayillay.online</h1>
            <p className="text-white/40 text-sm mt-1">Your personal AI job workspace</p>
          </div>

          {/* Card */}
          <div className="relative" style={{ animation: 'fadeUp 0.6s ease forwards', opacity: 0 }}>
            {/* Outer glow ring */}
            <div className="absolute -inset-px rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)' }} />

            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(40px)' }}>

              {/* Inner top highlight */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="p-8">
                {/* Header */}
                <div className="mb-7">
                  <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
                  <p className="text-white/40 text-sm">Sign in to continue to your workspace</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2.5 border border-white/10 rounded-xl px-4 py-3 mb-5 text-sm text-white/50 bg-white/[0.03]">
                    <span className="text-white/30">⚠</span> {error}
                  </div>
                )}

                {/* Google button */}
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full group relative flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.95)', color: '#111' }}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                  {/* Pressed state */}
                  <div className="absolute inset-0 scale-95 bg-white/10 opacity-0 group-active:opacity-100 transition-all duration-75 rounded-xl" />

                  {loading
                    ? <Loader2 size={17} className="animate-spin text-zinc-500" />
                    : <GoogleIcon />
                  }
                  <span className="font-semibold text-zinc-800">
                    {loading ? 'Redirecting…' : 'Continue with Google'}
                  </span>
                  {!loading && (
                    <span className="absolute right-4 text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-xs">→</span>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-white/20 text-xs">restricted access</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Footer note */}
                <p className="text-center text-white/20 text-xs leading-relaxed">
                  Only pre-authorised Google accounts can sign in.
                </p>
              </div>
            </div>
          </div>

          {/* Rotating capability ticker */}
          <div className="flex items-center justify-center gap-2 text-xs text-white/25">
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="tabular-nums transition-all duration-500" key={tick}>
              {['ATS score · CV tailoring · Interview prep', 'Gmail sync · Job tracker · Analytics', 'Cover letters · Version history · Kanban'][tick % 3]}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(80px,60px) scale(1.1); }
          70%      { transform: translate(-40px,80px) scale(0.9); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35%      { transform: translate(-60px,-40px) scale(1.08); }
          65%      { transform: translate(50px,30px) scale(0.92); }
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
