import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../lib/useCatalog';
import { categoryCopy } from '../lib/catalog';
import { ProductSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { BackButton } from '../components/BackButton';
import { CategorySwitcher } from '../components/CategorySwitcher';
import { ProductCard } from '../components/ProductCard';
import { collectSeries, collectSizes, matchesSeries, matchesSize } from '../lib/productMeta';
import { useLiveStock } from '../lib/stockSync';

export default function CategoryPage() {
  const { slug } = useParams();
  const { lang, t } = useLanguage();
  const { categories, counts } = useCatalog();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState('');
  const [series, setSeries] = useState('');
  const [showAll, setShowAll] = useState(false);
  useLiveStock(setProducts);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategoryAndProducts() {
      setLoading(true);
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single();

        if (cancelled) return;

        if (catError || !catData) {
          setCategory(null);
          setProducts([]);
          return;
        }
        setCategory(catData);

        const { data: prodData } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('category_id', catData.id)
          .eq('is_active', true);

        if (cancelled) return;
        setProducts(prodData || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCategory(null);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategoryAndProducts();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setSize('');
    setSeries('');
    setShowAll(false);
  }, [slug]);

  const title = category ? categoryCopy(category, lang).title : '';
  const sizes = collectSizes(products);
  const seriesOptions = collectSeries(products.filter((product) => matchesSize(product, size)));
  const guided = sizes.length > 0 || seriesOptions.length > 0 || collectSeries(products).length > 0;
  const visibleProducts = products.filter((product) => {
    if (!guided || showAll) return true;
    if (!size && !series) return false;
    return matchesSize(product, size || 'all') && matchesSeries(product, series || 'all');
  });

  function chooseSize(next) {
    setShowAll(false);
    setSize(next);
    setSeries((current) => {
      if (!current || current === 'all') return current;
      const stillThere = products.some((product) => matchesSize(product, next) && matchesSeries(product, current));
      return stillThere ? current : '';
    });
  }

  function chooseSeries(next) {
    setShowAll(false);
    setSeries(next);
  }

  function clearFilters() {
    setSize('');
    setSeries('');
    setShowAll(true);
  }

  const chip = (active) =>
    `inline-flex h-11 shrink-0 items-center rounded-full border px-3 text-sm font-bold transition-all duration-200 ease-out ${
      active ? 'border-ink bg-ink text-white shadow-sm' : 'border-slate-200/80 bg-white text-ink hover:shadow-md'
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <CategorySwitcher categories={categories} activeSlug={slug} counts={counts}>
        {!loading && category && guided && (
          <div className="space-y-2 border-t border-slate-100 py-2">
            {sizes.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-bold text-brass">{t.stepSize}</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button type="button" className={chip(size === 'all')} onClick={() => chooseSize('all')}>{t.allSizes}</button>
                  {sizes.map((item) => (
                    <button key={item} type="button" className={chip(size === item)} onClick={() => chooseSize(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(size || seriesOptions.length > 0) && seriesOptions.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-bold text-brass">{t.stepSeries}</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button type="button" className={chip(series === 'all')} onClick={() => chooseSeries('all')}>{t.allSeries}</button>
                  {seriesOptions.map((item) => (
                    <button key={item} type="button" className={chip(series === item)} onClick={() => chooseSeries(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={clearFilters} className="inline-flex h-11 items-center text-sm font-bold text-sapphire">
              {t.clearFilters}
            </button>
          </div>
        )}
      </CategorySwitcher>
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
        <>
          <div className="mb-4 mt-4">
            <p className="text-[11px] font-bold text-brass">{t.wholesaleRate}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
          </div>

          {products.length === 0 ? (
            <EmptyState icon="📦" title={t.noProducts} />
          ) : visibleProducts.length === 0 ? (
            <EmptyState icon="🔎" title={guided && !showAll && !size && !series ? t.chooseFilter : t.noFilterMatch} />
          ) : (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} slug={slug} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
