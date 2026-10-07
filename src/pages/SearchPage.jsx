import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { ProductSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import { BackButton } from '../components/BackButton'
import { ProductCard } from '../components/ProductCard'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!q) {
        setProducts([])
        setSearched(false)
        setLoading(false)
        return
      }
      setLoading(true)
      setSearched(true)
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*), categories(slug, name)')
        .eq('is_active', true)
        .ilike('name', `%${q}%`)
        .limit(40)
      if (!cancelled) {
        setProducts(data || [])
        setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [q])

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <BackButton fallback="/" />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{t.search}</h1>
      {q && <p className="mt-1 text-sm text-slate-500">“{q}”</p>}

      <div className="mt-5">
        {loading ? (
          <ProductSkeleton />
        ) : !q ? (
          <EmptyState icon="🔎" title={t.search} body={t.searchHint} />
        ) : searched && products.length === 0 ? (
          <EmptyState icon="🔎" title={t.searchEmpty} body={t.searchHint} />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} slug={prod.categories?.slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
