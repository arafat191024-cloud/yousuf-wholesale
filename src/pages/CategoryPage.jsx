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

export default function CategoryPage() {
  const { slug } = useParams();
  const { lang, t } = useLanguage();
  const { categories, counts } = useCatalog();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const title = category ? categoryCopy(category, lang).title : '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <CategorySwitcher categories={categories} activeSlug={slug} counts={counts} />
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
          ) : (
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} slug={slug} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
