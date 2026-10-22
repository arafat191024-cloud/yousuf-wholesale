import { useLanguage } from '../context/LanguageContext'
import { useCatalog } from '../lib/useCatalog'
import { ProductSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import { BackButton } from '../components/BackButton'
import { ProductCard } from '../components/ProductCard'

export function OffersPage() {
  const { lang, t } = useLanguage()
  const { products, loading } = useCatalog()
  const bn = lang === 'bn'

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <BackButton fallback="/" />
      <section className="mt-4 rounded-3xl border border-slate-200/80 bg-white px-5 py-6 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brass">
          {bn ? 'পাইকারি অফার' : 'Wholesale offers'}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {bn ? 'চলতি পাইকারি দর' : 'Current wholesale rates'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          {bn
            ? 'স্টকে থাকা কাস্টার হুইল, লক ও ফিটিংসের পাইকারি তালিকা। লট সাইজ পণ্যের বিবরণে দেওয়া আছে।'
            : 'In-catalog caster wheels, locks, and fittings at wholesale rates. Lot size is listed on each product.'}
        </p>
      </section>

      <div className="mt-5">
        {loading ? (
          <ProductSkeleton />
        ) : products.length === 0 ? (
          <EmptyState icon="📦" title={t.noProducts} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} slug={product.categories?.slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
