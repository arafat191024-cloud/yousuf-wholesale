import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useLiveStock } from './stockSync'

let cache = null
let inflight = null

async function loadCatalog() {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    const primary = await supabase.from('categories').select('*').order('display_order', { ascending: true })
    let rows = primary.data
    if (primary.error) {
      const fallback = await supabase.from('categories').select('*')
      rows = fallback.data
    }
    const { data: products } = await supabase
      .from('products')
      .select('*, product_variants(*), categories(slug, name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    const nextCounts = {}
    ;(products || []).forEach((row) => {
      if (!row.category_id) return
      nextCounts[row.category_id] = (nextCounts[row.category_id] || 0) + 1
    })
    cache = { categories: rows || [], products: products || [], counts: nextCounts }
    inflight = null
    return cache
  })()
  return inflight
}

export function useCatalog() {
  const [categories, setCategories] = useState(cache?.categories || [])
  const [products, setProducts] = useState(cache?.products || [])
  const [counts, setCounts] = useState(cache?.counts || {})
  const [loading, setLoading] = useState(!cache)
  const setLiveProducts = useCallback((updater) => {
    setProducts((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (cache) cache = { ...cache, products: next }
      return next
    })
  }, [])
  useLiveStock(setLiveProducts)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((data) => {
        if (cancelled) return
        setCategories(data.categories)
        setProducts(data.products)
        setCounts(data.counts)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) {
          setCategories([])
          setProducts([])
          setCounts({})
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { categories, products, counts, loading }
}
