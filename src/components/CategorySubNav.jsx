import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useCatalog } from '../lib/useCatalog'
import { categoryCopy } from '../lib/catalog'
import { FEATURED_NAV, categoryHref } from '../lib/storeNav'
import { HEADER_SHELL } from '../lib/layout'

const pillClass = (active) =>
  `inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-bold whitespace-nowrap transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
    active
      ? 'border-ink bg-ink text-white shadow-sm'
      : 'border-slate-200/80 bg-white text-ink hover:shadow-md'
  }`

export function CategorySubNav({ onHome }) {
  const { lang, t } = useLanguage()
  const { categories } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const slug = location.pathname.startsWith('/category/')
    ? decodeURIComponent(location.pathname.split('/')[2] || '')
    : ''

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!menuOpen) return undefined
    function onDoc(event) {
      if (!rootRef.current?.contains(event.target)) setMenuOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function label(bn, en) {
    return lang === 'bn' ? bn : en
  }

  function featuredActive(item) {
    return item.slugs.includes(slug)
  }

  const categoriesActive = Boolean(slug) && !FEATURED_NAV.some((item) => item.slugs.includes(slug))
  const homeActive = location.pathname === '/' && location.hash !== '#contact'
  const offersActive = location.pathname === '/offers'
  const contactActive = location.hash === '#contact'

  function onContact(event) {
    event.preventDefault()
    setMenuOpen(false)
    if (location.hash === '#contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate({ hash: 'contact' }, { replace: true })
  }

  return (
    <div ref={rootRef} className="border-t border-slate-100">
      <div className={HEADER_SHELL}>
      <div className="relative">
        <div className="no-scrollbar overflow-x-auto overscroll-x-contain whitespace-nowrap">
          <div className="flex w-max items-center gap-2 whitespace-nowrap py-2.5">
            <Link
              to="/"
              onClick={() => onHome?.()}
              className={pillClass(homeActive)}
              aria-current={homeActive ? 'page' : undefined}
            >
              {label('হোম', 'Home')}
            </Link>

            <button
              type="button"
              className={pillClass(categoriesActive || menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {label('ক্যাটাগরি', 'Categories')}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {FEATURED_NAV.map((item) => {
              const active = featuredActive(item)
              return (
                <Link
                  key={item.id}
                  to={categoryHref(categories, item.slugs)}
                  className={pillClass(active)}
                  aria-current={active ? 'page' : undefined}
                >
                  {label(item.bn, item.en)}
                </Link>
              )
            })}

            <Link to="/offers" className={pillClass(offersActive)} aria-current={offersActive ? 'page' : undefined}>
              {label('পাইকারি অফার', 'Wholesale Offers')}
            </Link>

            <a href="#contact" onClick={onContact} className={pillClass(contactActive)}>
              {label('যোগাযোগ', 'Contact')}
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden" aria-hidden="true" />
      </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white py-3">
          <div className={`${HEADER_SHELL} flex flex-wrap gap-2`}>
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">{t.loading}</p>
            ) : (
              categories.map((category) => {
                const active = category.slug === slug
                const copy = categoryCopy(category, lang)
                return (
                  <Link
                    key={category.id}
                    to={`/category/${encodeURIComponent(category.slug)}`}
                    className={pillClass(active)}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {copy.title}
                  </Link>
                )
              })
            )}
            <Link
              to="/#categories"
              className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold text-sapphire"
              onClick={() => setMenuOpen(false)}
            >
              {t.allCategories}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
