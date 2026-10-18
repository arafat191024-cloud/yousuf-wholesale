import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryCopy } from '../lib/catalog'
import { useScrollLock } from '../lib/useScrollLock'
import { useCart } from '../context/CartContext'

const PRICE_MIN = 0
const PRICE_MAX = 50000

export const SORT_OPTIONS = [
  { id: 'featured', bn: 'সাজান', en: 'Sort' },
  { id: 'price-asc', bn: 'দাম: কম থেকে বেশি', en: 'Price: Low to High' },
  { id: 'price-desc', bn: 'দাম: বেশি থেকে কম', en: 'Price: High to Low' },
  { id: 'name', bn: 'নাম', en: 'Name' },
  { id: 'stock', bn: 'স্টক', en: 'Stock' },
]

function FilterSection({ title, children }) {
  return (
    <details open className="filter-acc group border-b border-slate-100 py-3 last:border-b-0">
      <summary className="mb-2 cursor-pointer text-[11px] font-extrabold uppercase tracking-wide text-brass">
        <span className="flex items-center justify-between">
          {title}
          <span className="text-slate-400 transition-transform duration-150 group-open:rotate-180">▾</span>
        </span>
      </summary>
      {children}
    </details>
  )
}

const CountPill = memo(function CountPill({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-bold transition-all duration-150 transform-gpu active:scale-[0.98] ${
        active ? 'border-ink bg-ink text-white shadow-sm' : 'border-slate-200 bg-white text-ink hover:shadow-md'
      }`}
    >
      <span className="truncate">{children}</span>
      <span className={`ml-2 rounded-full px-1.5 text-[10px] ${active ? 'bg-white/15 text-amber-200' : 'bg-slate-100 text-slate-600'}`}>
        {count}
      </span>
    </button>
  )
})

export function SortSelect({ lang, value, onChange, className = '' }) {
  return (
    <label className={`block text-[11px] font-bold text-slate-500 ${className}`}>
      {lang === 'bn' ? 'সাজান' : 'Sort'}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-ink"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>{lang === 'bn' ? option.bn : option.en}</option>
        ))}
      </select>
    </label>
  )
}

export const CatalogFilters = memo(function CatalogFilters({
  lang,
  t,
  categories = [],
  activeSlug,
  categoryCounts = {},
  sizes = [],
  series = [],
  size,
  seriesValue,
  sizeCounts = {},
  seriesCounts = {},
  priceLo,
  priceHi,
  inStock = false,
  onInStock,
  onPrice,
  onSize,
  onSeries,
  onClear,
  activeCount = 0,
  showSort = false,
  sort = 'featured',
  onSort,
}) {
  const [draftLo, setDraftLo] = useState(priceLo)
  const [draftHi, setDraftHi] = useState(priceHi)

  useEffect(() => {
    setDraftLo(priceLo)
    setDraftHi(priceHi)
  }, [priceLo, priceHi])

  useEffect(() => {
    const timer = setTimeout(() => {
      const lo = Math.min(Math.max(PRICE_MIN, Number(draftLo) || PRICE_MIN), PRICE_MAX)
      const hi = Math.min(Math.max(PRICE_MIN, Number(draftHi) || PRICE_MAX), PRICE_MAX)
      const nextLo = Math.min(lo, hi)
      const nextHi = Math.max(lo, hi)
      if (nextLo !== priceLo || nextHi !== priceHi) onPrice(nextLo, nextHi)
    }, 200)
    return () => clearTimeout(timer)
  }, [draftLo, draftHi, onPrice, priceHi, priceLo])

  const pill = (active) =>
    `inline-flex min-h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-bold transition-all duration-150 transform-gpu active:scale-[0.98] ${
      active ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white text-ink hover:shadow-md'
    }`

  const span = ((Math.min(draftLo, draftHi) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const end = ((Math.max(draftLo, draftHi) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  return (
    <div className="space-y-1">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-ink">{lang === 'bn' ? 'ফিল্টার' : 'Filters'}</p>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs font-bold text-sapphire">
            {lang === 'bn' ? 'ফিল্টার মুছুন' : 'Clear All Filters'}
          </button>
        )}
      </div>

      {showSort && onSort && <SortSelect lang={lang} value={sort} onChange={onSort} className="mb-2" />}

      <FilterSection title={lang === 'bn' ? 'মূল্য পরিসর' : 'Price range'}>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-bold text-slate-500">
            {lang === 'bn' ? 'সর্বনিম্ন' : 'Min'}
            <span className="relative mt-1 block">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">৳</span>
              <input
                type="number"
                min={PRICE_MIN}
                max={PRICE_MAX}
                value={draftLo}
                onChange={(e) => setDraftLo(e.target.value === '' ? '' : Math.max(PRICE_MIN, Number(e.target.value) || 0))}
                className="h-10 w-full rounded-xl border border-slate-200 pl-6 pr-2 text-sm font-bold outline-none focus:border-ink"
              />
            </span>
          </label>
          <label className="text-[11px] font-bold text-slate-500">
            {lang === 'bn' ? 'সর্বোচ্চ' : 'Max'}
            <span className="relative mt-1 block">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">৳</span>
              <input
                type="number"
                min={PRICE_MIN}
                max={PRICE_MAX}
                value={draftHi}
                onChange={(e) => setDraftHi(e.target.value === '' ? '' : Math.min(PRICE_MAX, Number(e.target.value) || 0))}
                className="h-10 w-full rounded-xl border border-slate-200 pl-6 pr-2 text-sm font-bold outline-none focus:border-ink"
              />
            </span>
          </label>
        </div>
        <div className="dual-range mt-3">
          <div className="dual-track" />
          <div
            className="absolute top-[0.7rem] h-1 rounded-full bg-ink"
            style={{ left: `${span}%`, width: `${Math.max(end - span, 0)}%` }}
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={100}
            value={Math.min(Number(draftLo) || PRICE_MIN, Number(draftHi) || PRICE_MAX)}
            onChange={(e) => setDraftLo(Math.min(Number(e.target.value), Number(draftHi) || PRICE_MAX))}
            style={{ zIndex: Number(draftLo) > PRICE_MAX - 4000 ? 5 : 3 }}
            aria-label={lang === 'bn' ? 'সর্বনিম্ন মূল্য' : 'Minimum price'}
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={100}
            value={Math.max(Number(draftLo) || PRICE_MIN, Number(draftHi) || PRICE_MAX)}
            onChange={(e) => setDraftHi(Math.max(Number(e.target.value), Number(draftLo) || PRICE_MIN))}
            style={{ zIndex: 4 }}
            aria-label={lang === 'bn' ? 'সর্বোচ্চ মূল্য' : 'Maximum price'}
          />
        </div>
        <p className="text-[11px] font-semibold text-slate-500">৳{PRICE_MIN.toLocaleString()} – ৳{PRICE_MAX.toLocaleString()}</p>
      </FilterSection>

      {categories.length > 0 && (
        <FilterSection title={lang === 'bn' ? 'ক্যাটাগরি' : t.categories}>
          <div className="space-y-1.5">
            {categories.map((category) => {
              const copy = categoryCopy(category, lang)
              const active = category.slug === activeSlug
              return (
                <Link key={category.id} to={`/category/${category.slug}`} className={pill(active)}>
                  <span className="truncate">{copy.title}</span>
                  <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/15 text-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                    {categoryCounts[category.id] || 0}
                  </span>
                </Link>
              )
            })}
          </div>
        </FilterSection>
      )}

      {sizes.length > 0 && (
        <FilterSection title={lang === 'bn' ? 'সাইজ' : t.stepSize}>
          <div className="space-y-1.5">
            <CountPill active={size === 'all' || !size} onClick={() => onSize('all')} count={Object.values(sizeCounts).reduce((sum, n) => sum + n, 0)}>
              {t.allSizes}
            </CountPill>
            {sizes.map((item) => (
              <CountPill key={item} active={size === item} onClick={() => onSize(item)} count={sizeCounts[item] || 0}>
                {item}
              </CountPill>
            ))}
          </div>
        </FilterSection>
      )}

      {series.length > 0 && (
        <FilterSection title={lang === 'bn' ? 'সিরিজ' : t.stepSeries}>
          <div className="space-y-1.5">
            <CountPill active={seriesValue === 'all' || !seriesValue} onClick={() => onSeries('all')} count={Object.values(seriesCounts).reduce((sum, n) => sum + n, 0)}>
              {t.allSeries}
            </CountPill>
            {series.map((item) => (
              <CountPill key={item} active={seriesValue === item} onClick={() => onSeries(item)} count={seriesCounts[item] || 0}>
                {item}
              </CountPill>
            ))}
          </div>
        </FilterSection>
      )}

      <button
        type="button"
        onClick={() => onInStock?.(!inStock)}
        className={`mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-bold transition-all duration-150 transform-gpu active:scale-[0.98] ${
          inStock ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-ink'
        }`}
      >
        <span>{lang === 'bn' ? 'স্টকে আছে (In Stock Only)' : 'In Stock Only (স্টকে আছে)'}</span>
        <span className={`relative h-6 w-11 rounded-full transition-all duration-150 ${inStock ? 'bg-emerald-600' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-150 ${inStock ? 'left-5' : 'left-0.5'}`} />
        </span>
      </button>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-ink transition-all duration-150 transform-gpu active:scale-95"
        >
          {lang === 'bn' ? 'ফিল্টার মুছুন / Clear All Filters' : 'Clear All Filters / ফিল্টার মুছুন'}
        </button>
      )}
    </div>
  )
})

export function MobileFilterDrawer({ open, onClose, onApply, lang, t, children }) {
  useScrollLock(open)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] md:hidden">
      <button type="button" aria-label={t.close} className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="sheet-up absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-base font-extrabold text-ink">{lang === 'bn' ? 'ফিল্টার ও সর্ট' : 'Filter & Sort'}</p>
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold">
            {t.close}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{children}</div>
        <div className="border-t border-slate-100 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
          <button
            type="button"
            onClick={onApply}
            className="h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-150 transform-gpu active:scale-95"
          >
            {lang === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilterFab({ lang, onClick, count }) {
  const { totalCount } = useCart()
  const offset = totalCount > 0 ? '8.75rem' : '4.25rem'
  return (
    <div
      className="fixed inset-x-0 z-40 px-3 md:hidden"
      style={{ bottom: `calc(${offset} + env(safe-area-inset-bottom))` }}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-ink text-sm font-bold text-white shadow-lg transition-all duration-150 transform-gpu active:scale-95"
      >
        {lang === 'bn' ? 'ফিল্টার ও সর্ট' : 'Filter & Sort'}
        {count > 0 && (
          <span className="rounded-full bg-amber-400 px-2 text-[11px] font-extrabold text-ink">{count}</span>
        )}
      </button>
    </div>
  )
}

export { PRICE_MIN, PRICE_MAX }
