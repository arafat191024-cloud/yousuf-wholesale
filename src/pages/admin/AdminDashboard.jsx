import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0 })

  useEffect(() => {
    async function loadStats() {
      const [{ count: products }, { count: customers }, { count: orders }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ])
      setStats({ products: products || 0, customers: customers || 0, orders: orders || 0 })
    }
    loadStats()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
        <div><strong>{stats.products}</strong><br />Total Products</div>
        <div><strong>{stats.customers}</strong><br />Total Customers</div>
        <div><strong>{stats.orders}</strong><br />Total Orders</div>
      </div>
      <p style={{ marginTop: 24, color: '#666' }}>
        Product management, order management, and customer lists will be added in Phase 4.
      </p>
    </div>
  )
}
