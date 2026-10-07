import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { categoryCopy } from '../lib/catalog'

export function CategorySwitcher({ categories, activeSlug, counts, children }) {
  const { lang, t } = useLanguage()
  const [top, setTop] = useState(72)

  useEffect(() => {
    const el = document.getElementById('site-header')
    if (!el) return undefined
    const update = () => setTop(el.getBoundingClientRect().height)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!categories?.length) return null

  return (
    <div
      className="sticky z-30 -mx-4 mb-4 border-b border-slate-200/80 bg-[#F8FAFC]/95 px-4 py-2 backdrop-blur-md"
      style={{ top }}
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const active = category.slug === activeSlug
          const copy = categoryCopy(category, lang)
          const count = counts?.[category.id] || 0
          return (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-all duration-200 ease-out ${
                active
                  ? 'border-ink bg-ink text-white shadow-sm'
                  : 'border-slate-200/80 bg-white text-ink hover:shadow-md'
              }`}
            >
              {copy.title}
              <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/15 text-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </Link>
          )
        })}
        <Link
          to="/"
          className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-sapphire"
        >
          {t.allCategories}
        </Link>
      </div>
      {children}
    </div>
  )
}
