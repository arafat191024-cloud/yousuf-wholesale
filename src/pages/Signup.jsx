import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await signUp(form)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
        <h2>Check your email</h2>
        <p>We sent a confirmation link to {form.email}.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Name" value={form.name} onChange={update('name')} required />
        <input placeholder="Phone" value={form.phone} onChange={update('phone')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        <input type="password" placeholder="Password" value={form.password} onChange={update('password')} required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Create Account</button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
