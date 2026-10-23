import { memo, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { formatTaka } from '../lib/format'
import { fallbackImage } from '../lib/catalog'
import { QtyStepper } from './QtyStepper'
import { availableUnits, priceUnitLabel, productSeries, productSizes } from '../lib/productMeta'

export const ProductCard = memo(function ProductCard({ product, slug }) {
  const { addToCart } = useCart()
  const { lang, t } = useLanguage()
  const variants = product.product_variants || []
  const variant = variants[0] || null
  const lotSize = Math.max(1, Number(product.min_wholesale_qty) || 1)
  const [qty, setQty] = useState(lotSize)

  const price = variant ? variant.price : product.price
  const stockQty = availableUnits(product, variant && variants.length ? variant : null)
  const inStock = stockQty > 0
  const unitLabel = priceUnitLabel(product, lang)
  const image = product.image_url || fallbackImage(slug)
  const meta = [productSizes(product)[0], productSeries(product)].filter(Boolean).join(' · ')

  const add = useCallback((amount = qty) => {
    addToCart(product, variant, amount)
  }, [addToCart, product, qty, variant])

  return (
    <article className="premium-card flex flex-col overflow-hidden rounded-2xl transition-all duration-150 transform-gpu active:scale-[0.99]">
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100 text-left">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-all duration-150 ease-out transform-gpu hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex max-w-[90%] flex-wrap gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {inStock
              ? (lang === 'bn' ? `স্টকে আছে · ${stockQty}` : `In Stock · ${stockQty}`)
              : (lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock')}
          </span>
          <span className="rounded-full bg-[#0F172A]/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-200">
            {t.wholesaleRate}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <Link to={`/product/${product.id}`} className="text-left">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-ink sm:text-sm">{product.name}</h3>
        </Link>
        {meta && <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-500">{meta}</p>}
        <p className="mt-1 text-sm font-extrabold text-ink sm:text-base">
          {formatTaka(price, lang)}
          <span className="ml-1 text-[11px] font-semibold text-slate-500">{unitLabel}</span>
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
          {t.minLot} {lotSize} {t.pcs}
        </p>
        <div className="mt-2 flex justify-center">
          <QtyStepper value={qty} min={1} max={inStock ? stockQty : 1} onChange={setQty} lang={lang} compact disabled={!inStock} />
        </div>
        <button
          type="button"
          onClick={() => add(qty)}
          disabled={!inStock}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-ink px-2 text-xs font-bold text-white shadow-sm transition-all duration-150 ease-out transform-gpu active:scale-95 hover:bg-navy hover:shadow-md disabled:bg-slate-400"
        >
          {t.addToCart}
        </button>
      </div>
    </article>
  )
})
