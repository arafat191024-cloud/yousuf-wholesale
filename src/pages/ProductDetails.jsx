import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ZoomIn, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useCatalog, fetchProductById } from '../lib/useCatalog'
import { categoryCopy, fallbackImage } from '../lib/catalog'
import { formatTaka } from '../lib/format'
import { availableUnits, priceUnitLabel, productSeries, productSizes } from '../lib/productMeta'
import { useScrollLock } from '../lib/useScrollLock'
import { QtyStepper } from '../components/QtyStepper'
import { EmptyState } from '../components/EmptyState'
import { useOverlayHistory } from '../lib/useOverlayHistory'

function goBack(navigate, fallback) {
  const idx = window.history.state?.idx
  if (typeof idx === 'number' && idx > 0) navigate(-1)
  else navigate(fallback)
}

export function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, t } = useLanguage()
  const { addToCart } = useCart()
  const { categories, products, loading: catalogLoading } = useCatalog()
  const [remote, setRemote] = useState(null)
  const [fetchState, setFetchState] = useState('loading')
  const [variantId, setVariantId] = useState(null)
  const [qty, setQty] = useState(1)
  const [zoom, setZoom] = useState(false)
  const closeZoom = useOverlayHistory(zoom, () => setZoom(false))
  useScrollLock(zoom)

  const cached = useMemo(
    () => products.find((item) => String(item.id) === String(id)) || null,
    [products, id],
  )
  const product = remote || cached

  useEffect(() => {
    let cancelled = false
    setRemote(null)
    setFetchState('loading')
    setZoom(false)
    fetchProductById(id)
      .then((row) => {
        if (cancelled) return
        if (!row || row.is_active === false) {
          setRemote(null)
          setFetchState('done')
          return
        }
        setRemote(row)
        setFetchState('done')
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setFetchState('done')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const variants = product?.product_variants || []
  const variant = variants.find((item) => item.id === variantId) || variants[0] || null
  const lotSize = Math.max(1, Number(product?.min_wholesale_qty) || 1)
  const preparedFor = useRef(null)

  useEffect(() => {
    if (!product || preparedFor.current === product.id) return
    preparedFor.current = product.id
    setVariantId((product.product_variants || [])[0]?.id || null)
    setQty(Math.max(1, Number(product.min_wholesale_qty) || 1))
  }, [product])

  useEffect(() => {
    if (!zoom) return undefined
    function onKey(event) {
      if (event.key === 'Escape') closeZoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom, closeZoom])

  const categoryRow = useMemo(() => {
    if (!product) return null
    return categories.find((item) => item.id === product.category_id)
      || categories.find((item) => item.slug && item.slug === product.categories?.slug)
      || null
  }, [categories, product])

  const categoryTitle = categoryRow
    ? categoryCopy(categoryRow, lang).title
    : (product?.categories?.name || '')
  const categorySlug = categoryRow?.slug || product?.categories?.slug || ''
  const series = product ? productSeries(product) : ''
  const sizes = product ? productSizes(product) : []
  const price = variant ? variant.price : product?.price
  const stockQty = product ? availableUnits(product, variant && variants.length ? variant : null) : 0
  const inStock = stockQty > 0
  const unitLabel = product ? priceUnitLabel(product, lang) : ''
  const image = product?.image_url || fallbackImage(categorySlug)
  const unitPrice = Number(price || 0)
  const lotTotal = unitPrice * lotSize
  const lineTotal = unitPrice * Math.max(1, Number(qty) || 1)
  const description = String(product?.description || '').trim()

  const related = useMemo(() => {
    if (!product) return []
    const sameCategory = products.filter((item) => item.id !== product.id && item.category_id === product.category_id)
    const sameSeries = series ? sameCategory.filter((item) => productSeries(item) === series) : []
    const rest = sameCategory.filter((item) => !sameSeries.some((match) => match.id === item.id))
    const picked = sameSeries.length >= 3 ? sameSeries : [...sameSeries, ...rest]
    return picked.slice(0, 4)
  }, [product, products, series])

  function add() {
    if (!product || !inStock) return
    addToCart(product, variant, qty)
  }

  const pending = !product && (fetchState === 'loading' || catalogLoading)
  const missing = !product && !pending

  if (pending) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="h-11 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-200 lg:col-span-4" />
          <div className="space-y-3 lg:col-span-5">
            <div className="h-8 w-3/4 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (missing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <EmptyState
          title={t.productMissing}
          action={
            <Link to="/" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white">
              {t.home}
            </Link>
          }
        />
      </div>
    )
  }

  const fallback = categorySlug ? `/category/${encodeURIComponent(categorySlug)}` : '/'

  return (
    <div className="mx-auto max-w-7xl px-4 pb-36 pt-4 sm:px-6 md:pb-10">
      <button
        type="button"
        onClick={() => goBack(navigate, fallback)}
        className="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-sm font-bold text-ink shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md"
      >
        <span aria-hidden="true">←</span>
        {t.goBack}
      </button>

      <nav aria-label="Breadcrumb" className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
        <Link to="/" className="font-semibold text-slate-600 hover:text-ink">{lang === 'bn' ? 'হোম' : 'Home'}</Link>
        {categoryTitle && (
          <>
            <span aria-hidden="true">&gt;</span>
            <Link
              to={`/category/${encodeURIComponent(categorySlug)}`}
              className="font-semibold text-slate-600 hover:text-ink"
            >
              {categoryTitle}
            </Link>
          </>
        )}
        <span aria-hidden="true">&gt;</span>
        <span className="font-bold text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="premium-card overflow-hidden rounded-3xl">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="group relative block aspect-square w-full bg-slate-50"
              aria-label={t.zoomPreview}
            >
              <img
                src={image}
                alt={product.name}
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-contain transition-transform duration-200 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm">
                <ZoomIn size={14} aria-hidden="true" />
                {t.zoomPreview}
              </span>
            </button>
          </div>
          <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-brass">
            {t.importer}
          </p>
        </div>

        <div className="lg:col-span-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{product.name}</h1>
          <dl className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {series && (
              <div className="rounded-full bg-slate-100 px-2.5 py-1">
                <dt className="sr-only">{t.seriesLabel}</dt>
                <dd>{series}</dd>
              </div>
            )}
            {sizes.length > 0 && (
              <div className="rounded-full bg-slate-100 px-2.5 py-1">
                <dt className="sr-only">{t.sizeLabel}</dt>
                <dd>{sizes.join(', ')}</dd>
              </div>
            )}
            {product.product_code && (
              <div className="rounded-full bg-slate-100 px-2.5 py-1">
                <dt className="inline">{t.sku}: </dt>
                <dd className="inline">{product.product_code}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brass">{t.wholesaleRate}</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">
              {formatTaka(unitPrice, lang)}
              <span className="ml-1 text-sm font-semibold text-slate-500">{unitLabel}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {t.minLot}: <span className="font-bold text-ink">{lotSize} {t.pcs}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t.lotCalc}: {lotSize} × {formatTaka(unitPrice, lang)} = <span className="font-extrabold text-ink">{formatTaka(lotTotal, lang)}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t.lineSubtotal}: {qty} × {formatTaka(unitPrice, lang)} = <span className="font-extrabold text-ink">{formatTaka(lineTotal, lang)}</span>
            </p>
            <p className={`mt-2 text-xs font-bold ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
              {inStock
                ? (lang === 'bn' ? `স্টকে আছে · ${stockQty}` : `In stock · ${stockQty}`)
                : t.outOfStock}
            </p>
          </div>

          {description && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h4 className="mb-1.5 text-sm font-semibold text-gray-900">{t.productDescription}</h4>
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {description}
              </div>
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold text-slate-600">{t.selectSize}</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((item) => {
                  const selected = variant?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVariantId(item.id)}
                      className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-all duration-150 ease-out active:scale-95 ${
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

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold text-slate-600">{t.quantity}</p>
            <QtyStepper
              value={qty}
              min={1}
              max={inStock ? stockQty : 1}
              onChange={setQty}
              lang={lang}
              disabled={!inStock}
            />
          </div>

          <div
            className="fixed inset-x-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur md:static md:z-auto md:mt-5 md:border-0 md:bg-transparent md:px-0 md:py-0"
            style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={add}
              disabled={!inStock}
              className="h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white shadow-sm transition-all duration-150 ease-out hover:bg-navy hover:shadow-md disabled:bg-slate-400"
            >
              {t.addToCart}
            </button>
          </div>
        </div>

        <aside className="lg:col-span-3">
          <div className="premium-card rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold text-ink">{t.seeMore}</h2>
              {categorySlug && (
                <Link
                  to={`/category/${encodeURIComponent(categorySlug)}`}
                  className="shrink-0 text-xs font-bold text-sapphire hover:underline"
                >
                  {t.seeAll}
                </Link>
              )}
            </div>
            {related.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">{t.noProducts}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {related.map((item) => {
                  const itemPrice = (item.product_variants || [])[0]?.price ?? item.price
                  const thumb = item.image_url || fallbackImage(categorySlug)
                  return (
                    <li key={item.id}>
                      <Link
                        to={`/product/${item.id}`}
                        className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-50"
                      >
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"
                        />
                        <span className="min-w-0">
                          <span className="line-clamp-2 block text-sm font-bold leading-snug text-ink">{item.name}</span>
                          <span className="mt-0.5 block text-sm font-extrabold text-ink">
                            {formatTaka(itemPrice, lang)}
                            <span className="ml-1 text-[11px] font-semibold text-slate-500">{priceUnitLabel(item, lang)}</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0F172A]/80 p-4">
          <button type="button" className="absolute inset-0" aria-label={t.close} onClick={closeZoom} />
          <button
            type="button"
            onClick={closeZoom}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-md"
            aria-label={t.close}
          >
            <X size={18} />
          </button>
          <img src={image} alt={product.name} className="relative max-h-[88vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  )
}
