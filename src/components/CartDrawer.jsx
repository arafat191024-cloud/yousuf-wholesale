import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useScrollLock } from '../lib/useScrollLock';
import { formatTaka } from '../lib/format';
import { EmptyState } from './EmptyState';
import { CartLines } from './CartLines';

export function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, totalAmount, clearCart } = useCart();
  const { lang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const open = isCartOpen && !isAdmin;
  useScrollLock(open);

  if (isAdmin) return null;

  function close() {
    setIsCartOpen(false);
  }

  function checkout() {
    setIsCartOpen(false);
    navigate('/checkout');
  }

  return (
    <div
      className={`fixed inset-0 z-[60] transition-all duration-200 ease-out ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
      inert={open ? undefined : ''}
    >
      <button type="button" aria-label={t.back} className="absolute inset-0 bg-[#0F172A]/50" onClick={close} />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-2xl transition-all duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-lg font-extrabold text-ink">{t.cartTitle}</h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 items-center gap-1 rounded-full border border-slate-200/80 px-3 text-sm font-bold text-ink transition-all duration-200 ease-out hover:shadow-md"
          >
            <span aria-hidden="true">←</span>
            {t.back}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {cartItems.length === 0 ? (
            <EmptyState icon="🛒" title={t.cartEmpty} body={t.cartEmptyBody} />
          ) : (
            <CartLines />
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{t.total}</span>
              <span className="text-xl font-extrabold text-ink">{formatTaka(totalAmount, lang)}</span>
            </div>
            <button
              type="button"
              onClick={checkout}
              className="h-12 w-full rounded-2xl bg-brass text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:bg-brass-deep hover:shadow-md"
            >
              {t.proceedCheckout}
            </button>
            <button
              type="button"
              onClick={close}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/80 text-sm font-bold text-ink transition-all duration-200 ease-out hover:shadow-md"
            >
              {t.continueShopping}
            </button>
            <button
              type="button"
              onClick={clearCart}
              className="mt-1 h-11 w-full text-xs font-semibold text-slate-500 transition-all duration-200 ease-out"
            >
              {t.clearCart}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
