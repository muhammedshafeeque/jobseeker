import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    const userRaw = params.get('user')
    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw))
        setSession(token, user)
        navigate('/', { replace: true })
      } catch {
        navigate('/login?error=invalid', { replace: true })
      }
    } else {
      navigate('/login?error=invalid', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-zinc-400 text-sm flex items-center gap-2">
        <span className="animate-spin text-lg">⟳</span> Signing you in…
      </div>
    </div>
  )
}
