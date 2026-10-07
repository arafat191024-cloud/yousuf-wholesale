import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatTaka } from '../lib/format'
import { fallbackImage } from '../lib/catalog'
import { useScrollLock } from '../lib/useScrollLock'

export function ProductCard({ product, slug }) {
  const { addToCart } = useCart()
  const { lang, t } = useLanguage()
  const variants = product.product_variants || []
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState(variants[0] || null)
  const lotSize = Math.max(1, Number(product.min_wholesale_qty) || 1)
  const [qty, setQty] = useState(lotSize)
  useScrollLock(open)

  const price = variant ? variant.price : product.price
  const stockQty = variant ? variant.stock : product.stock
  const inStock = Number(stockQty) > 0
  const image = product.image_url || fallbackImage(slug)
  const lotTotal = Number(price || 0) * lotSize

  function add(amount = qty) {
    setOpen(false)
    addToCart(product, variant, amount)
  }

  return (
    <>
      <article className="premium-card flex flex-col overflow-hidden rounded-2xl">
        <button type="button" onClick={() => setOpen(true)} className="relative aspect-square overflow-hidden bg-slate-100 text-left">
          <img src={image} alt={product.name} className="h-full w-full object-cover transition-all duration-200 ease-out hover:scale-[1.03]" />
          <div className="absolute left-2 top-2 flex max-w-[90%] flex-wrap gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {inStock ? t.inStock : t.outOfStock}
            </span>
            <span className="rounded-full bg-[#0F172A]/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-200">
              {t.wholesaleRate}
            </span>
          </div>
        </button>
        <div className="flex flex-1 flex-col p-2.5 sm:p-3">
          <button type="button" onClick={() => setOpen(true)} className="text-left">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-ink sm:text-sm">{product.name}</h3>
          </button>
          <p className="mt-1 text-sm font-extrabold text-ink sm:text-base">
            {formatTaka(price, lang)}
            <span className="ml-1 text-[11px] font-semibold text-slate-500">{t.perPiece}</span>
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
            {t.minLot} {lotSize} {t.pcs}
          </p>
          <button
            type="button"
            onClick={() => add(lotSize)}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-ink px-2 text-xs font-bold text-white shadow-sm transition-all duration-200 ease-out hover:bg-navy hover:shadow-md"
          >
            {t.addToCart}
          </button>
        </div>
      </article>

      {open && (
        <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-6">
          <button type="button" className="absolute inset-0 bg-[#0F172A]/55" aria-label={t.back} onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl sm:rounded-3xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center gap-1 rounded-full border border-slate-200/80 px-3 text-sm font-bold text-ink transition-all duration-200 ease-out hover:shadow-md"
              >
                <span aria-hidden="true">←</span>
                {t.back}
              </button>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-brass">{t.importer}</span>
            </div>
            <img src={image} alt="" className="h-64 w-full object-cover sm:h-72" />
            <div className="space-y-4 px-4 py-4">
              {product.product_code && (
                <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{product.product_code}</span>
              )}
              <h2 className="text-xl font-extrabold text-ink">{product.name}</h2>
              {product.description && <p className="text-sm leading-relaxed text-slate-500">{product.description}</p>}

              {variants.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-600">{t.selectSize}</p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((item) => {
                      const selected = variant?.id === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVariant(item)}
                          className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ease-out ${
                            selected ? 'bg-ink text-white' : 'border border-slate-200/80 bg-slate-50 text-ink'
                          }`}
                        >
                          {item.size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">{t.wholesaleRate}</p>
                  <p className="text-2xl font-extrabold text-ink">
                    {formatTaka(price, lang)}
                    <span className="ml-1 text-xs font-semibold text-slate-500">{t.perPiece}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.perCarton} ({lotSize} {t.pcs}): <span className="font-bold text-ink">{formatTaka(lotTotal, lang)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-[11px] font-semibold text-slate-500">{t.quantity}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label={t.decrease} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80" onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="h-11 w-14 rounded-xl border border-slate-200/80 text-center text-sm font-bold outline-none"
                    />
                    <button type="button" aria-label={t.increase} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80" onClick={() => setQty((n) => n + 1)}>+</button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => add(qty)}
                className="h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:bg-navy hover:shadow-md"
              >
                {t.addToCart}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
