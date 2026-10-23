import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useCatalog } from '../lib/useCatalog'
import { categoryCopy } from '../lib/catalog'
import { CategorySkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'
import { CategoryIcon } from '../components/CategoryIcon'
import { PromoBanner } from '../components/PromoBanner'

export function Home() {
  const { categories, counts, loading } = useCatalog()
  const { lang, t } = useLanguage()
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#categories') {
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, loading])

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <PromoBanner />

      <div id="categories" className="scroll-mt-48 pt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-extrabold tracking-tight text-ink">{t.categories}</h2>
        </div>
        {loading ? (
          <CategorySkeleton />
        ) : categories.length === 0 ? (
          <EmptyState icon="🏪" title={t.noProducts} />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {categories.map((category) => {
              const copy = categoryCopy(category, lang)
              const count = counts[category.id] || 0
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="premium-card group flex flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative h-28 overflow-hidden bg-slate-100 sm:h-36">
                    <img
                      src={copy.image}
                      alt={copy.title}
                      className="h-full w-full object-cover transition-all duration-200 ease-out group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-ink shadow-sm">
                      <CategoryIcon name={copy.icon} className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col px-3 py-3">
                    <h3 className="text-sm font-extrabold leading-snug text-ink sm:text-base">{copy.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{copy.description}</p>
                    <p className="mt-2 text-[11px] font-bold text-brass">
                      {count} {lang === 'en' ? (count === 1 ? 'item' : 'items') : t.productsWord}
                    </p>
                    <span className="mt-2 text-xs font-bold text-sapphire">{t.viewProducts} →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
