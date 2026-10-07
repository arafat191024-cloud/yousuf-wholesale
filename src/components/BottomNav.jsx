import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatTaka } from '../lib/format'

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconBag() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8h12l-1 13H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  )
}

function IconReceipt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export function BottomNav() {
  const { t } = useLanguage()
  const { totalCount, setIsCartOpen } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  const itemClass = (active) =>
    `flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-all duration-200 ease-out ${
      active ? 'text-brass' : 'text-slate-500'
    }`

  function goCategories() {
    if (location.pathname === '/') {
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/#categories')
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 shadow-[0_-8px_24px_rgb(15_23_42/0.04)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch px-1 pt-1">
        <button type="button" className={itemClass(location.pathname === '/')} onClick={() => navigate('/')}>
          <IconHome />
          {t.home}
        </button>
        <button
          type="button"
          className={itemClass(location.pathname.startsWith('/category') || location.hash === '#categories')}
          onClick={goCategories}
        >
          <IconGrid />
          {t.navCategories}
        </button>
        <button type="button" className={itemClass(false)} onClick={() => setIsCartOpen(true)}>
          <span className="relative">
            <IconBag />
            {totalCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[9px] font-extrabold text-white">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </span>
          {t.cart}
        </button>
        <button type="button" className={itemClass(location.pathname === '/orders')} onClick={() => navigate('/orders')}>
          <IconReceipt />
          {t.orders}
        </button>
      </div>
    </nav>
  )
}

export function CheckoutFab() {
  const { lang, t } = useLanguage()
  const { cartItems, totalAmount, totalCount, setIsCartOpen } = useCart()
  const location = useLocation()

  if (!cartItems.length || location.pathname.startsWith('/admin') || location.pathname === '/checkout') return null

  return (
    <div
      className="fixed inset-x-0 z-30 px-4 md:hidden"
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="flex h-12 w-full items-center justify-between rounded-2xl bg-ink px-4 text-white shadow-lg transition-all duration-200 ease-out active:scale-[0.99]"
      >
        <span className="text-sm font-bold">{t.viewCart}</span>
        <span className="text-sm font-extrabold">
          {totalCount} · {formatTaka(totalAmount, lang)}
        </span>
      </button>
    </div>
  )
}
