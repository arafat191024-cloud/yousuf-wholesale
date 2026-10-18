import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLiveStock } from '../lib/stockSync'

const DISMISS_KEY = 'admin-stock-alert-dismissed'

export function AdminStockAlert({ lang = 'bn' }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1')
  useLiveStock(setProducts)

  useEffect(() => {
    let cancelled = false
    supabase.from('products').select('id, stock').then(({ data }) => {
      if (!cancelled && data) setProducts(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(() => {
    let out = 0
    let low = 0
    products.forEach((product) => {
      const stock = Number(product.stock) || 0
      if (stock <= 0) out += 1
      else if (stock < 10) low += 1
    })
    return { out, low }
  }, [products])

  if (dismissed || (counts.out === 0 && counts.low === 0)) return null

  const message = lang === 'bn'
    ? `সতর্কতা: ${counts.out} টি পণ্যের স্টক শেষ এবং ${counts.low} টি পণ্যের স্টক সীমিত। দ্রুত রি-স্টক করুন।`
    : `Warning: ${counts.out} products are out of stock and ${counts.low} are running low. Restock soon.`

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
      <p className="min-w-0 flex-1 font-bold leading-snug">⚠️ {message}</p>
      <button
        type="button"
        onClick={() => navigate('/admin/products?stock=out')}
        className="inline-flex h-11 items-center rounded-xl bg-ink px-4 text-xs font-bold text-white transition-all duration-150 transform-gpu active:scale-95"
      >
        {lang === 'bn' ? 'পণ্যগুলো দেখুন' : 'View products'}
      </button>
      <button
        type="button"
        aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1')
          setDismissed(true)
        }}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300 bg-white text-base font-bold text-amber-900"
      >
        ✕
      </button>
    </div>
  )
}
