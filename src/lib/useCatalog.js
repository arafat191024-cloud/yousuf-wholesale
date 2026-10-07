import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useCatalog() {
  const [categories, setCategories] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const primary = await supabase.from('categories').select('*').order('display_order', { ascending: true })
        let rows = primary.data
        if (primary.error) {
          const fallback = await supabase.from('categories').select('*')
          rows = fallback.data
        }
        const { data: products } = await supabase.from('products').select('category_id').eq('is_active', true)
        const nextCounts = {}
        ;(products || []).forEach((row) => {
          if (!row.category_id) return
          nextCounts[row.category_id] = (nextCounts[row.category_id] || 0) + 1
        })
        if (!cancelled) {
          setCategories(rows || [])
          setCounts(nextCounts)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setCategories([])
          setCounts({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { categories, counts, loading }
}
