import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useLiveStock } from './stockSync'

let cache = null
let inflight = null

export const PRODUCT_SELECT = 'id, name, description, price, stock, image_url, product_code, series, size, min_wholesale_qty, unit, category_id, is_active, created_at, product_variants(*), categories(slug, name)'

async function selectProducts(id) {
  let query = supabase.from('products').select(PRODUCT_SELECT)
  query = id ? query.eq('id', id).maybeSingle() : query.eq('is_active', true).order('created_at', { ascending: false })
  const detailed = await query
  if (!detailed.error) return detailed

  let fallback = supabase.from('products').select('*, product_variants(*), categories(slug, name)')
  fallback = id ? fallback.eq('id', id).maybeSingle() : fallback.eq('is_active', true).order('created_at', { ascending: false })
  return fallback
}

export async function fetchProductById(id) {
  const { data, error } = await selectProducts(id)
  if (error) throw error
  return data || null
}

async function loadCatalog() {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const primary = await supabase.from('categories').select('*').order('display_order', { ascending: true })
      let rows = primary.data
      if (primary.error) {
        const fallback = await supabase.from('categories').select('*')
        rows = fallback.data
      }
      const { data: products, error } = await selectProducts()
      if (error) console.error(error)
      const nextCounts = {}
      ;(products || []).forEach((row) => {
        if (!row.category_id) return
        nextCounts[row.category_id] = (nextCounts[row.category_id] || 0) + 1
      })
      cache = { categories: rows || [], products: products || [], counts: nextCounts }
      return cache
    } finally {
      inflight = null
    }
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
