import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export function SiteHeader() {
  const { lang, toggleLanguage, t } = useLanguage()
  const { totalCount, setIsCartOpen } = useCart()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function onSearch(e) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="min-w-0 shrink-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">Wholesale</span>
          <span className="block truncate text-base font-extrabold text-ink sm:text-lg">{t.shopName}</span>
        </Link>

        <form onSubmit={onSearch} className="mx-auto hidden min-w-0 flex-1 md:block">
          <label className="sr-only" htmlFor="site-search">{t.search}</label>
          <input
            id="site-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-full border border-stone-200 bg-sand px-4 text-sm outline-none transition-all duration-200 focus:border-ink focus:bg-white"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-stone-200 bg-white px-3 text-xs font-bold text-ink shadow-sm transition-all duration-200 hover:border-stone-300"
          >
            {lang === 'bn' ? t.switchToEn : t.switchToBn}
          </button>

          <Link
            to="/orders"
            className="hidden h-11 items-center rounded-full px-3 text-sm font-semibold text-ink transition-all duration-200 hover:bg-sand md:inline-flex"
          >
            {t.orders}
          </Link>

          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="hidden h-11 items-center rounded-full border border-stone-200 px-3 text-sm font-semibold transition-all duration-200 hover:bg-sand md:inline-flex"
            >
              {t.logout}
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden h-11 items-center rounded-full border border-stone-200 px-3 text-sm font-semibold transition-all duration-200 hover:bg-sand md:inline-flex"
            >
              {t.login}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-ink px-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-ink/90"
            aria-label={t.cart}
          >
            {t.cart}
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-extrabold text-white">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={onSearch} className="px-4 pb-3 md:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.search}
          className="h-11 w-full rounded-full border border-stone-200 bg-sand px-4 text-sm outline-none transition-all duration-200 focus:border-ink focus:bg-white"
        />
      </form>
    </header>
  )
}
