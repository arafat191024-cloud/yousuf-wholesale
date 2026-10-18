import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { ProductSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import { BackButton } from '../components/BackButton'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../lib/useCatalog'
import { productSearchText } from '../lib/productMeta'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const { t } = useLanguage()
  const { products: catalog, loading } = useCatalog()

  const products = useMemo(() => {
    if (!q) return []
    const needle = q.toLowerCase()
    return catalog.filter((product) => productSearchText(product).includes(needle))
  }, [catalog, q])

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
        ) : products.length === 0 ? (
          <EmptyState icon="🔎" title={t.searchEmpty} body={t.searchHint} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} slug={prod.categories?.slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
