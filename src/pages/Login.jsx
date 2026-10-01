import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await signIn({ email, password })
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
      <button onClick={signInWithGoogle} style={{ marginTop: 10 }}>
        Continue with Google
      </button>
      <p style={{ marginTop: 12 }}>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  )
}
