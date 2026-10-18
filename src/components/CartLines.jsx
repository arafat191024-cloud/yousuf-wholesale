import { memo } from 'react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatTaka } from '../lib/format'
import { fallbackImage } from '../lib/catalog'
import { QtyStepper } from './QtyStepper'

const CartRow = memo(function CartRow({ item, lang, t, updateQuantity, removeFromCart }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <img
        src={item.image || fallbackImage()}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-16 w-16 shrink-0 rounded-xl border border-slate-200/80 object-cover"
      />
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-bold text-ink">{item.title}</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatTaka(item.unitPrice, lang)} {t.perPiece}
          {item.lotSize ? ` · ${t.minLot} ${item.lotSize}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <QtyStepper
            value={item.quantity}
            min={1}
            max={Number(item.stock) > 0 ? Number(item.stock) : undefined}
            onChange={(qty) => updateQuantity(item.key, qty)}
            lang={lang}
            compact
          />
          <button
            type="button"
            aria-label={t.remove}
            className="inline-flex h-11 items-center rounded-xl px-2 text-xs font-bold text-red-600 transition-all duration-150 ease-out transform-gpu active:scale-95 hover:bg-red-50"
            onClick={() => removeFromCart(item.key)}
          >
            {t.remove}
          </button>
        </div>
      </div>
      <p className="shrink-0 text-sm font-extrabold text-ink">{formatTaka(item.unitPrice * item.quantity, lang)}</p>
    </li>
  )
})

export function CartLines() {
  const { cartItems, updateQuantity, removeFromCart } = useCart()
  const { lang, t } = useLanguage()

  return (
    <ul className="divide-y divide-slate-100">
      {cartItems.map((item) => (
        <CartRow
          key={item.key}
          item={item}
          lang={lang}
          t={t}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
        />
      ))}
    </ul>
  )
}
