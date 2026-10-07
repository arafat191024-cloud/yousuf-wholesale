import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { BackButton } from '../components/BackButton'

function friendlyAuthError(message, t) {
  const text = String(message || '').toLowerCase()
  if (text.includes('invalid') || text.includes('credential') || text.includes('password')) return t.badLogin
  return t.authFailed
}

export function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error: signError } = await signIn({ email, password })
    if (signError) {
      const message = friendlyAuthError(signError.message, t)
      setError(message)
      toast.error(message)
    } else {
      navigate('/')
    }
  }

  const field = 'h-11 w-full rounded-xl border border-slate-200/80 px-3 text-sm outline-none transition-all duration-200 ease-out focus:border-ink'

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <BackButton fallback="/" />
      <div className="premium-card mt-4 rounded-3xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t.login}</h1>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input className={field} type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={field} type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button type="submit" className="h-12 rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200 ease-out hover:bg-navy">
            {t.login}
          </button>
        </form>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-3 h-11 w-full rounded-2xl border border-slate-200/80 text-sm font-bold transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow-md"
        >
          {t.googleContinue}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          <Link to="/signup" className="font-bold text-brass">{t.noAccount}</Link>
        </p>
      </div>
    </div>
  )
}
