import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { LanguageToggle } from './LanguageToggle'
import { SUPPORT } from '../lib/paymentConfig'

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3A2 2 0 0 1 18.5 19 15 15 0 0 1 5 5.5a2 2 0 0 1 1.5-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 3v-12.5z" strokeLinejoin="round" />
    </svg>
  )
}

export function SiteHeader() {
  const { t } = useLanguage()
  const { totalCount, setIsCartOpen } = useCart()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function onSearch(e) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const iconBtn = 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-sapphire shadow-sm transition-all duration-200 ease-out hover:shadow-md'

  return (
    <header id="site-header" className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <Link to="/" className="min-w-0 shrink-0">
          <span className="block text-[10px] font-bold text-brass">{t.importer}</span>
          <span className="block truncate text-base font-extrabold tracking-tight text-ink sm:text-lg">{t.shopName}</span>
        </Link>

        <form onSubmit={onSearch} className="mx-auto hidden min-w-0 flex-1 md:block">
          <label className="sr-only" htmlFor="site-search">{t.search}</label>
          <input
            id="site-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-full border border-slate-200/80 bg-slate-50 px-4 text-sm outline-none transition-all duration-200 ease-out focus:border-ink focus:bg-white focus:shadow-sm"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a href={`tel:${SUPPORT.phone}`} className={iconBtn} aria-label={t.call}>
            <IconPhone />
          </a>
          <a href={`https://wa.me/${SUPPORT.whatsapp}`} target="_blank" rel="noreferrer" className={iconBtn} aria-label={t.whatsapp}>
            <IconChat />
          </a>
          <div className="hidden md:block">
            <LanguageToggle />
          </div>

          <Link
            to="/orders"
            className="hidden h-11 items-center rounded-full px-3 text-sm font-semibold text-ink transition-all duration-200 ease-out hover:bg-slate-50 md:inline-flex"
          >
            {t.orders}
          </Link>

          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="hidden h-11 items-center rounded-full border border-slate-200/80 px-3 text-sm font-semibold transition-all duration-200 ease-out hover:bg-slate-50 md:inline-flex"
            >
              {t.logout}
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden h-11 items-center rounded-full border border-slate-200/80 px-3 text-sm font-semibold transition-all duration-200 ease-out hover:bg-slate-50 md:inline-flex"
            >
              {t.login}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-ink px-3 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:bg-navy hover:shadow-md"
            aria-label={t.cart}
          >
            <span className="hidden sm:inline">{t.cart}</span>
            <span className="sm:hidden" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8h12l-1 13H7L6 8z" />
                <path d="M9 8V7a3 3 0 0 1 6 0v1" />
              </svg>
            </span>
            {totalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-[10px] font-extrabold text-white">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pb-3 md:hidden">
        <form onSubmit={onSearch} className="min-w-0 flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.search}
            className="h-11 w-full rounded-full border border-slate-200/80 bg-slate-50 px-4 text-sm outline-none transition-all duration-200 ease-out focus:border-ink focus:bg-white"
          />
        </form>
        <LanguageToggle />
      </div>
    </header>
  )
}
