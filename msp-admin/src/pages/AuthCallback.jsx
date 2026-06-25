import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function AuthCallback() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    if (!code) { navigate('/login?error=invalid', { replace: true }); return }

    // Exchange the one-time code for the real JWT.
    // The token is never exposed in the URL (and therefore never logged by nginx).
    api.post('/auth/exchange', { code })
      .then(({ data }) => {
        setSession(data.token, data.user)
        // replace: true removes the ?code= URL from history
        navigate('/', { replace: true })
      })
      .catch(() => navigate('/login?error=invalid', { replace: true }))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-zinc-400 text-sm flex items-center gap-2">
        <span className="animate-spin text-lg">⟳</span> Signing you in…
      </div>
    </div>
  )
}
