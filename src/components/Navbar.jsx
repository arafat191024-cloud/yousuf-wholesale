import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px', borderBottom: '1px solid #eee'
    }}>
      <Link to="/" style={{ fontWeight: 700, textDecoration: 'none', color: '#111' }}>
        Yousuf Enterprise
      </Link>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {isAdmin && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <Link to="/orders">My Orders</Link>
            <button onClick={signOut}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
