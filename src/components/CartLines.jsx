import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatTaka } from '../lib/format'
import { fallbackImage } from '../lib/catalog'

export function CartLines() {
  const { cartItems, updateQuantity, removeFromCart } = useCart()
  const { lang, t } = useLanguage()

  return (
    <ul className="divide-y divide-slate-100">
      {cartItems.map((item) => (
        <li key={item.key} className="flex items-center gap-3 py-3">
          <img
            src={item.image || fallbackImage()}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl border border-slate-200/80 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-bold text-ink">{item.title}</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatTaka(item.unitPrice, lang)} {t.perPiece}
              {item.lotSize ? ` · ${t.minLot} ${item.lotSize}` : ''}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <button
                type="button"
                aria-label={t.decrease}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg transition-all duration-200 ease-out hover:shadow-md"
                onClick={() => updateQuantity(item.key, item.quantity - 1)}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
              <button
                type="button"
                aria-label={t.increase}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg transition-all duration-200 ease-out hover:shadow-md"
                onClick={() => updateQuantity(item.key, item.quantity + 1)}
              >
                +
              </button>
              <button
                type="button"
                aria-label={t.remove}
                className="inline-flex h-11 items-center rounded-xl px-2 text-xs font-bold text-red-600 transition-all duration-200 ease-out hover:bg-red-50"
                onClick={() => removeFromCart(item.key)}
              >
                {t.remove}
              </button>
            </div>
          </div>
          <p className="shrink-0 text-sm font-extrabold text-ink">{formatTaka(item.unitPrice * item.quantity, lang)}</p>
        </li>
      ))}
    </ul>
  )
}
