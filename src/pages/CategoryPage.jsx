import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { ProductSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';

function fallbackImage(slug) {
  if (slug === 'door-locks') {
    return 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=600';
  }
  if (slug === 'handle-locks') {
    return 'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=600';
  }
  if (slug === 'handles') {
    return 'https://images.pexels.com/photos/7174391/pexels-photo-7174391.jpeg?auto=compress&cs=tinysrgb&w=600';
  }
  return '/wheels.png';
}

export default function CategoryPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { addToCart } = useCart();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});

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

        const initVariants = {};
        const initQuantities = {};
        (prodData || []).forEach((p) => {
          if (p.product_variants && p.product_variants.length > 0) {
            initVariants[p.id] = p.product_variants[0];
          }
          initQuantities[p.id] = Math.max(1, Number(p.min_wholesale_qty) || 10);
        });
        setSelectedVariants(initVariants);
        setQuantities(initQuantities);
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

  const handleVariantChange = (productId, variant) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const handleQuantityChange = (productId, val) => {
    const qty = Math.max(1, parseInt(val, 10) || 1);
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-xl bg-stone-200" />
        <ProductSkeleton />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title={t.categoryMissing}
          action={
            <Link to="/" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white">
              {t.home}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link to="/" className="text-sm font-semibold text-stone-500 transition-all duration-200 hover:text-ink">
          {t.allCategories}
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">{category.name}</h1>
      </div>

      {products.length === 0 ? (
        <EmptyState icon="📦" title={t.noProducts} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((prod) => {
            const hasVariants = prod.product_variants && prod.product_variants.length > 0;
            const currentVariant = selectedVariants[prod.id];
            const displayPrice = hasVariants && currentVariant ? currentVariant.price : prod.price;
            const currentQty = quantities[prod.id] || 10;
            const stockQty = hasVariants && currentVariant ? currentVariant.stock : prod.stock;
            const inStock = Number(stockQty) > 0;
            const lotSize = Math.max(1, Number(prod.min_wholesale_qty) || 1);
            const lotTotal = Number(displayPrice || 0) * lotSize;
            const image = prod.image_url || fallbackImage(slug);

            return (
              <article
                key={prod.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-56 overflow-hidden bg-stone-100">
                  <img src={image} alt={prod.name} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                      {inStock ? t.inStock : t.outOfStock}
                    </span>
                    <span className="rounded-full bg-ink/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
                      {t.wholesaleExclusive}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <span className="w-fit rounded-md bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600">
                    {prod.product_code || 'WHOLESALE'}
                  </span>
                  <h3 className="mt-2 text-lg font-extrabold text-ink">{prod.name}</h3>
                  {prod.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">{prod.description}</p>
                  )}

                  {hasVariants && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-bold text-stone-600">{t.selectSize}</p>
                      <div className="flex flex-wrap gap-2">
                        {prod.product_variants.map((v) => {
                          const isSelected = currentVariant?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleVariantChange(prod.id, v)}
                              className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
                                isSelected ? 'bg-ink text-white' : 'border border-stone-200 bg-sand text-ink'
                              }`}
                            >
                              {v.size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto border-t border-stone-100 pt-4">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{t.wholesaleRate}</p>
                        <p className="text-2xl font-extrabold text-ink">
                          ৳{displayPrice}
                          <span className="ml-1 text-xs font-semibold text-stone-500">{t.perPiece}</span>
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {t.perCarton} ({lotSize} {t.pcs}): <span className="font-bold text-ink">৳{lotTotal.toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <label className="mb-1 block text-[11px] font-semibold text-stone-500">{t.quantity}</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 transition-all duration-200 hover:bg-sand"
                            onClick={() => handleQuantityChange(prod.id, currentQty - 1)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={currentQty}
                            onChange={(e) => handleQuantityChange(prod.id, e.target.value)}
                            className="h-11 w-14 rounded-xl border border-stone-200 text-center text-sm font-bold outline-none"
                          />
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 transition-all duration-200 hover:bg-sand"
                            onClick={() => handleQuantityChange(prod.id, currentQty + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(prod, currentVariant, currentQty)}
                      className="h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-ink/90"
                    >
                      {t.addToCart}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
