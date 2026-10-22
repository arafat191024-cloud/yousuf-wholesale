import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../lib/useCatalog';
import { categoryCopy } from '../lib/catalog';
import { ProductSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { BackButton } from '../components/BackButton';
import { ProductCard } from '../components/ProductCard';
import { CatalogFilters, FilterFab, MobileFilterDrawer, PRICE_MAX, PRICE_MIN, SortSelect } from '../components/CatalogFilters';
import { collectSeries, collectSizes, matchesSeries, matchesSize, productSeries, productSizes } from '../lib/productMeta';

function productPrice(product) {
  return Number(product?.price) || 0;
}

function productStock(product) {
  const variants = product?.product_variants || [];
  if (variants.length) {
    const variantStock = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
    return variantStock || Number(product?.stock) || 0;
  }
  return Number(product?.stock) || 0;
}

function countLabel(count, lang) {
  const formatted = new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US').format(count);
  return lang === 'bn' ? `দেখাচ্ছে ${formatted}টি পণ্য` : `Showing ${formatted} wholesale items`;
}

const EMPTY_FILTERS = {
  size: 'all',
  series: 'all',
  priceLo: PRICE_MIN,
  priceHi: PRICE_MAX,
  inStock: false,
  sort: 'featured',
};

export default function CategoryPage() {
  const { slug } = useParams();
  const { lang, t } = useLanguage();
  const { categories, counts, products: catalog, loading } = useCatalog();

  const [size, setSize] = useState('all');
  const [series, setSeries] = useState('all');
  const [priceLo, setPriceLo] = useState(PRICE_MIN);
  const [priceHi, setPriceHi] = useState(PRICE_MAX);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('featured');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setSize('all');
    setSeries('all');
    setPriceLo(PRICE_MIN);
    setPriceHi(PRICE_MAX);
    setInStock(false);
    setSort('featured');
    setMobileOpen(false);
    setDraft(null);
  }, [slug]);

  const category = useMemo(
    () => categories.find((item) => item.slug === slug) || null,
    [categories, slug],
  );

  const products = useMemo(
    () => (category ? catalog.filter((product) => product.category_id === category.id) : []),
    [catalog, category],
  );

  const title = category ? categoryCopy(category, lang).title : '';
  const sizes = useMemo(() => collectSizes(products), [products]);
  const allSeries = useMemo(() => collectSeries(products), [products]);

  const sizeCounts = useMemo(() => {
    const map = {};
    products.forEach((product) => {
      productSizes(product).forEach((item) => {
        map[item] = (map[item] || 0) + 1;
      });
    });
    return map;
  }, [products]);

  const seriesFor = useCallback((sizeValue) => {
    const map = {};
    products.filter((product) => matchesSize(product, sizeValue)).forEach((product) => {
      const label = productSeries(product);
      if (!label) return;
      map[label] = (map[label] || 0) + 1;
    });
    return {
      map,
      options: allSeries.filter((item) => sizeValue === 'all' || map[item]),
    };
  }, [allSeries, products]);

  const committedSeries = useMemo(() => seriesFor(size), [seriesFor, size]);
  const draftSeries = useMemo(() => seriesFor(draft?.size || 'all'), [draft?.size, seriesFor]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const price = productPrice(product);
      if (price < priceLo || price > priceHi) return false;
      if (!matchesSize(product, size) || !matchesSeries(product, series)) return false;
      if (inStock && productStock(product) <= 0) return false;
      return true;
    });
    const list = [...filtered];
    if (sort === 'price-asc') list.sort((a, b) => productPrice(a) - productPrice(b));
    else if (sort === 'price-desc') list.sort((a, b) => productPrice(b) - productPrice(a));
    else if (sort === 'name') list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    else if (sort === 'stock') list.sort((a, b) => productStock(b) - productStock(a));
    return list;
  }, [products, priceLo, priceHi, size, series, inStock, sort]);

  const chooseSize = useCallback((next) => {
    setSize(next);
    setSeries((current) => {
      if (!current || current === 'all') return current;
      const stillThere = products.some((product) => matchesSize(product, next) && matchesSeries(product, current));
      return stillThere ? current : 'all';
    });
  }, [products]);

  const chooseSeries = useCallback((next) => {
    setSeries(next);
  }, []);

  const onPrice = useCallback((lo, hi) => {
    setPriceLo(lo);
    setPriceHi(hi);
  }, []);

  const clearFilters = useCallback(() => {
    setSize(EMPTY_FILTERS.size);
    setSeries(EMPTY_FILTERS.series);
    setPriceLo(EMPTY_FILTERS.priceLo);
    setPriceHi(EMPTY_FILTERS.priceHi);
    setInStock(EMPTY_FILTERS.inStock);
  }, []);

  const activeFilterCount = [
    size !== 'all',
    series !== 'all',
    priceLo !== PRICE_MIN || priceHi !== PRICE_MAX,
    inStock,
  ].filter(Boolean).length;

  const draftCount = draft ? [
    draft.size !== 'all',
    draft.series !== 'all',
    draft.priceLo !== PRICE_MIN || draft.priceHi !== PRICE_MAX,
    draft.inStock,
  ].filter(Boolean).length : 0;

  const openMobile = useCallback(() => {
    setDraft({ size, series, priceLo, priceHi, inStock, sort });
    setMobileOpen(true);
  }, [size, series, priceLo, priceHi, inStock, sort]);

  const applyMobile = useCallback(() => {
    if (draft) {
      setSize(draft.size);
      setSeries(draft.series);
      setPriceLo(draft.priceLo);
      setPriceHi(draft.priceHi);
      setInStock(draft.inStock);
      setSort(draft.sort);
    }
    setMobileOpen(false);
  }, [draft]);

  const filterProps = {
    lang,
    t,
    categories,
    activeSlug: slug,
    categoryCounts: counts,
    sizes,
    series: committedSeries.options,
    size,
    seriesValue: series,
    sizeCounts,
    seriesCounts: committedSeries.map,
    priceLo,
    priceHi,
    inStock,
    onInStock: setInStock,
    onPrice,
    onSize: chooseSize,
    onSeries: chooseSeries,
    onClear: clearFilters,
    activeCount: activeFilterCount,
  };

  const draftProps = draft ? {
    ...filterProps,
    series: draftSeries.options,
    size: draft.size,
    seriesValue: draft.series,
    seriesCounts: draftSeries.map,
    priceLo: draft.priceLo,
    priceHi: draft.priceHi,
    inStock: draft.inStock,
    sort: draft.sort,
    showSort: true,
    activeCount: draftCount,
    onPrice: (lo, hi) => setDraft((current) => (current ? { ...current, priceLo: lo, priceHi: hi } : current)),
    onSize: (next) => setDraft((current) => {
      if (!current) return current;
      const stillThere = !current.series || current.series === 'all'
        || products.some((product) => matchesSize(product, next) && matchesSeries(product, current.series));
      return { ...current, size: next, series: stillThere ? current.series : 'all' };
    }),
    onSeries: (next) => setDraft((current) => (current ? { ...current, series: next } : current)),
    onInStock: (next) => setDraft((current) => (current ? { ...current, inStock: next } : current)),
    onSort: (next) => setDraft((current) => (current ? { ...current, sort: next } : current)),
    onClear: () => setDraft((current) => (current ? { ...current, ...EMPTY_FILTERS, sort: current.sort } : current)),
  } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 pb-16 md:pb-4">
      <BackButton fallback="/" />

      {loading ? (
        <div className="mt-4">
          <div className="mb-4 h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
          <ProductSkeleton />
        </div>
      ) : !category ? (
        <div className="mx-auto max-w-lg py-12">
          <EmptyState
            title={t.categoryMissing}
            action={
              <Link to="/" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white">
                {t.home}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start">
          <aside className="hidden w-72 flex-shrink-0 md:block">
            <div className="sticky top-36 self-start max-h-[calc(100vh-10rem)] space-y-6 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <CatalogFilters {...filterProps} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-brass">{t.wholesaleRate}</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
                <p className="mt-1 text-sm font-bold text-slate-600">{countLabel(visibleProducts.length, lang)}</p>
              </div>
              <div className="hidden w-56 md:block">
                <SortSelect lang={lang} value={sort} onChange={setSort} />
              </div>
            </div>

            {products.length === 0 ? (
              <EmptyState icon="📦" title={t.noProducts} />
            ) : visibleProducts.length === 0 ? (
              <EmptyState icon="🔎" title={t.noFilterMatch} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} slug={slug} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && category && <FilterFab lang={lang} count={activeFilterCount} onClick={openMobile} />}
      <MobileFilterDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} onApply={applyMobile} lang={lang} t={t}>
        {draftProps && <CatalogFilters {...draftProps} />}
      </MobileFilterDrawer>
    </div>
  );
}
