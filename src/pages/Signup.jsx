import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export function Signup() {
  const { signUp } = useAuth()
  const { t, lang } = useLanguage()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error: signError } = await signUp(form)
    if (signError) {
      setError(signError.message)
      toast.error(signError.message)
    } else {
      setDone(true)
      toast.success(lang === 'bn' ? 'কনফার্মেশন ইমেইল পাঠানো হয়েছে' : 'Confirmation email sent')
    }
  }

  const field = 'h-11 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none transition-all duration-200 focus:border-ink'

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-ink">{lang === 'bn' ? 'ইমেইল দেখুন' : 'Check your email'}</h1>
          <p className="mt-2 text-sm text-stone-500">{form.email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-ink">{t.signup}</h1>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <input className={field} placeholder={t.yourName} value={form.name} onChange={update('name')} required />
          <input className={field} placeholder={t.phoneRequired} value={form.phone} onChange={update('phone')} required />
          <input className={field} type="email" placeholder={t.email} value={form.email} onChange={update('email')} required />
          <input className={field} type="password" placeholder={t.password} value={form.password} onChange={update('password')} required />
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button type="submit" className="h-12 rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200">
            {t.signup}
          </button>
        </form>
        <p className="mt-4 text-sm text-stone-500">
          <Link to="/login" className="font-bold text-brass">{t.login}</Link>
        </p>
      </div>
    </div>
  )
}
