import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useScrollLock } from '../lib/useScrollLock'
import { formatTaka } from '../lib/format'
import { fallbackImage } from '../lib/catalog'

export function AddedSheet() {
  const navigate = useNavigate()
  const { addedOpen, setAddedOpen, addedItem, cartItems, updateQuantity, totalAmount, setIsCartOpen } = useCart()
  const { lang, t } = useLanguage()
  useScrollLock(addedOpen)

  if (!addedOpen || !addedItem) return null

  const line = cartItems.find((item) => item.key === addedItem.key)
  const quantity = line?.quantity || 0
  const unitPrice = line?.unitPrice ?? addedItem.unitPrice
  const lineTotal = unitPrice * quantity

  function continueShopping() {
    setAddedOpen(false)
  }

  function proceed() {
    setAddedOpen(false)
    setIsCartOpen(false)
    navigate('/checkout')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label={t.continueShopping} className="absolute inset-0 bg-[#0F172A]/55" onClick={continueShopping} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="added-title"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl transition-all duration-200 ease-out sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[11px] font-bold text-brass">{t.addedToCart}</p>
            <h2 id="added-title" className="text-lg font-extrabold text-ink">{t.yourOrder}</h2>
          </div>
          <button
            type="button"
            onClick={continueShopping}
            className="inline-flex h-11 items-center gap-1 rounded-full border border-slate-200/80 px-3 text-sm font-bold text-ink transition-all duration-200 ease-out hover:shadow-md"
          >
            <span aria-hidden="true">←</span>
            {t.back}
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">
          <p className="text-sm leading-relaxed text-slate-500">{t.addedBody}</p>
          <div className="mt-4 flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3 shadow-sm">
            <img
              src={addedItem.image || fallbackImage()}
              alt=""
              className="h-24 w-24 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-extrabold text-ink">{addedItem.title}</h3>
              {addedItem.productCode && (
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{addedItem.productCode}</p>
              )}
              <p className="mt-1 text-sm font-bold text-ink">
                {formatTaka(unitPrice, lang)} <span className="text-xs font-semibold text-slate-500">{t.perPiece}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t.minLot}: {addedItem.lotSize} {t.pcs}
                {addedItem.size ? ` · ${addedItem.size}` : ''}
              </p>
            </div>
          </div>

            {line && (
            <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t.quantity}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t.decrease}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg transition-all duration-200 ease-out hover:shadow-md"
                onClick={() => updateQuantity(addedItem.key, quantity - 1)}
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-extrabold">{quantity}</span>
              <button
                type="button"
                aria-label={t.increase}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg transition-all duration-200 ease-out hover:shadow-md"
                onClick={() => updateQuantity(addedItem.key, quantity + 1)}
              >
                +
              </button>
            </div>
            </div>
            )}

          <div className="mt-4 space-y-2 rounded-2xl bg-[#0F172A] px-4 py-3 text-white">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{t.lineSubtotal}</span>
              <span className="font-bold">{formatTaka(lineTotal, lang)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{t.total}</span>
              <span className="text-xl font-extrabold">{formatTaka(totalAmount, lang)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 border-t border-slate-100 px-4 py-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={continueShopping}
            className="h-12 rounded-2xl border border-slate-200/80 bg-white text-sm font-bold text-ink shadow-sm transition-all duration-200 ease-out hover:shadow-md"
          >
            {t.continueShopping}
          </button>
          <button
            type="button"
            onClick={proceed}
            className="h-12 rounded-2xl bg-brass text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:bg-brass-deep hover:shadow-md"
          >
            {t.proceedCheckout}
          </button>
        </div>
      </div>
    </div>
  )
}
