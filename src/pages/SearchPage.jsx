import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { ProductSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const { t } = useLanguage()
  const { addToCart } = useCart()
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-ink">{t.search}</h1>
      {q && <p className="mt-1 text-sm text-stone-500">“{q}”</p>}

      <div className="mt-6">
        {loading ? (
          <ProductSkeleton />
        ) : !q ? (
          <EmptyState icon="🔎" title={t.search} body={t.searchHint} />
        ) : searched && products.length === 0 ? (
          <EmptyState icon="🔎" title={t.searchEmpty} body={t.searchHint} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {products.map((prod) => {
              const variant = prod.product_variants?.[0] || null
              const price = variant ? variant.price : prod.price
              const slug = prod.categories?.slug
              return (
                <article key={prod.id} className="flex gap-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                  <img
                    src={prod.image_url || '/wheels.png'}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-extrabold text-ink">{prod.name}</h2>
                    <p className="mt-1 text-sm font-bold">৳{price} <span className="font-medium text-stone-500">{t.perPiece}</span></p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {slug && (
                        <Link to={`/category/${slug}`} className="inline-flex h-11 items-center rounded-xl border border-stone-200 px-3 text-xs font-bold">
                          {t.viewProducts}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => addToCart(prod, variant, Math.max(1, Number(prod.min_wholesale_qty) || 1))}
                        className="inline-flex h-11 items-center rounded-xl bg-ink px-3 text-xs font-bold text-white transition-all duration-200"
                      >
                        {t.addToCart}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
