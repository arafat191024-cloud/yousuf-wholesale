import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { LanguageToggle } from './LanguageToggle'
import { CategorySubNav } from './CategorySubNav'
import { SUPPORT } from '../lib/paymentConfig'
import { HEADER_SHELL } from '../lib/layout'
import { useHeaderAutoHide } from '../lib/useHeaderAutoHide'
import { useOverlayHistory } from '../lib/useOverlayHistory'

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

function ClearSearchButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      aria-label={label}
    >
      <X size={16} />
    </button>
  )
}

export function SiteHeader() {
  const { lang, t } = useLanguage()
  const { totalCount, setIsCartOpen } = useCart()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const homeSearch = location.pathname === '/' && searchTerm.trim().length > 0
  useOverlayHistory(homeSearch, () => setSearchTerm(''), 'search')
  const headerHidden = useHeaderAutoHide()
  const isCheckout = location.pathname === '/checkout'
  const collapsed = headerHidden && !isCheckout

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q')
    if (location.pathname === '/' && !q) {
      setSearchTerm('')
      return
    }
    if (location.pathname === '/search') setSearchTerm(q || '')
  }, [location.pathname, location.search])

  function resetSearch() {
    setSearchTerm('')
  }

  function clearSearch() {
    setSearchTerm('')
    const q = new URLSearchParams(location.search).get('q')
    if (q || location.pathname === '/search') navigate('/', { replace: true })
  }

  function onSearch(e) {
    e.preventDefault()
    const q = searchTerm.trim()
    const target = q ? `/search?q=${encodeURIComponent(q)}` : '/'
    navigate(target, { replace: window.history.state?.overlay === 'search' })
  }

  const iconBtn = 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-sapphire shadow-sm transition-all duration-200 ease-out hover:shadow-md'

  function goBack() {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <header
      id="site-header"
      className={`sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-transform md:translate-y-0 md:pointer-events-auto ${
        collapsed ? 'pointer-events-none -translate-y-full duration-300' : 'translate-y-0 duration-200'
      }`}
    >
      {isCheckout && (
        <div className="relative flex h-12 items-center md:hidden">
          <div className={`${HEADER_SHELL} flex h-12 items-center`}>
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 items-center text-sm font-bold text-ink"
            >
              ← {lang === 'bn' ? 'ফিরে যান' : 'Back'}
            </button>
          </div>
          <p className="pointer-events-none absolute left-1/2 top-1/2 w-[min(18rem,68%)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-sm font-extrabold text-ink">
            {lang === 'bn' ? 'অর্ডার সম্পন্ন করুন (Checkout)' : 'Complete your order (Checkout)'}
          </p>
        </div>
      )}

      <div className={isCheckout ? 'hidden md:block' : undefined}>
      <div className={`${HEADER_SHELL} flex items-center gap-2 py-2.5 sm:gap-3`}>
        <Link to="/" onClick={resetSearch} className="min-w-0 shrink-0">
          <span className="block text-[10px] font-bold text-brass">{t.importer}</span>
          <span className="block truncate text-base font-extrabold tracking-tight text-ink sm:text-lg">{t.shopName}</span>
        </Link>

        <form onSubmit={onSearch} className="relative mx-auto hidden min-w-0 flex-1 md:block">
          <label className="sr-only" htmlFor="site-search">{t.search}</label>
          <input
            id="site-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-full border border-slate-200/80 bg-slate-50 pl-4 pr-10 text-sm outline-none transition-all duration-200 ease-out focus:border-ink focus:bg-white focus:shadow-sm"
          />
          {searchTerm && <ClearSearchButton onClick={clearSearch} label={t.clearSearch} />}
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

      <div className={`${HEADER_SHELL} flex items-center gap-2 pb-3 md:hidden`}>
        <form onSubmit={onSearch} className="relative min-w-0 flex-1">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.search}
            className="h-11 w-full rounded-full border border-slate-200/80 bg-slate-50 pl-4 pr-10 text-sm outline-none transition-all duration-200 ease-out focus:border-ink focus:bg-white"
          />
          {searchTerm && <ClearSearchButton onClick={clearSearch} label={t.clearSearch} />}
        </form>
        <LanguageToggle />
      </div>
      <CategorySubNav onHome={resetSearch} />
      </div>
    </header>
  )
}
