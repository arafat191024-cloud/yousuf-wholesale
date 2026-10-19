import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../../components/EmptyState';
import { BackButton } from '../../components/BackButton';
import { LanguageToggle } from '../../components/LanguageToggle';
import { ProductFormDrawer } from '../../components/ProductFormDrawer';
import { AdminStockAlert } from '../../components/AdminStockAlert';
import { insertProductRow, updateProductRow } from '../../lib/orderInsert';
import { productSearchText, productSeries, productSizes } from '../../lib/productMeta';
import { imageFileFromList, isInlineImageUrl, uploadProductImage } from '../../lib/productImage';
import { useLiveStock } from '../../lib/stockSync';

const copy = {
  bn: {
    title: 'পণ্য ও মজুদ',
    total: 'মোট পণ্য',
    orders: 'অর্ডার ব্যবস্থাপনা',
    refresh: 'হালনাগাদ',
    addTitle: 'নতুন পণ্য যোগ করুন',
    name: 'পণ্যের নাম',
    category: 'ক্যাটাগরি',
    code: 'পণ্য কোড',
    price: 'পাইকারি দর (৳)',
    stock: 'শুরুর স্টক (পিস)',
    image: 'ছবির লিংক',
    description: 'বিবরণ',
    add: 'নতুন প্রোডাক্ট যোগ করুন / Add Product',
    adding: 'যোগ হচ্ছে...',
    required: 'পণ্যের নাম, দাম এবং ক্যাটাগরি দিন।',
    added: 'পণ্য যোগ হয়েছে',
    updated: 'পণ্য হালনাগাদ হয়েছে',
    addError: 'পণ্য যোগ হয়নি',
    edit: 'এডিট',
    searchProducts: 'নাম, সাইজ বা সিরিজ খুঁজুন',
    stockError: 'মজুদ হালনাগাদ হয়নি',
    live: 'বর্তমান মজুদ ও দৃশ্যমানতা',
    product: 'পণ্য',
    rate: 'পাইকারি দর',
    rateSaved: 'রেট সফলভাবে আপডেট হয়েছে',
    rateError: 'রেট হালনাগাদ হয়নি',
    rateInvalid: 'সঠিক দর লিখুন',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    memo: 'নতুন মেমো',
    stockStatus: 'স্টক',
    actions: 'স্টক অ্যাডজাস্ট',
    status: 'অবস্থা',
    inStock: 'স্টকে আছে',
    out: 'স্টক আউট',
    active: 'দেখা যাচ্ছে',
    hidden: 'লুকানো',
    empty: 'কোনো পণ্য পাওয়া যায়নি',
    pcs: 'পিস',
    allTab: 'All Products (সব)',
    inTab: 'In Stock (স্টকে আছে)',
    lowTab: 'Low Stock (< 10 pcs) (কম স্টক)',
    outTab: 'Out of Stock (0 pcs) (স্টক শেষ)',
    low: 'কম স্টক',
    changePhoto: 'ছবি পরিবর্তন',
    imageSaved: 'ছবি সফলভাবে আপলোড হয়েছে',
    imageFailed: 'ছবি আপলোড হয়নি। আবার চেষ্টা করুন।',
    imageLarge: 'কমপ্রেসের পরেও ছবি ৫০০ KB-এর বেশি।',
    imageHeic: 'এই HEIC ছবি পড়া যায়নি। JPEG বা PNG দিন।',
    imageDecode: 'এই ছবিটি পড়া যায়নি। JPEG, PNG বা HEIC দিন।',
    imageData: 'বড় ছবি ডাটাবেজে রাখা হয় না। WebP আপলোড করুন।',
  },
  en: {
    title: 'Products & stock',
    total: 'Total products',
    orders: 'Orders dashboard',
    refresh: 'Refresh',
    addTitle: 'Add a product',
    name: 'Product name',
    category: 'Category',
    code: 'Product code',
    price: 'Wholesale price (৳)',
    stock: 'Opening stock (pcs)',
    image: 'Image URL',
    description: 'Description',
    add: 'Add Product / নতুন প্রোডাক্ট যোগ করুন',
    adding: 'Adding...',
    required: 'Product name, price, and category are required.',
    added: 'Product added',
    updated: 'Product updated',
    addError: 'Could not add product',
    edit: 'Edit',
    searchProducts: 'Search name, size, or series',
    stockError: 'Stock update failed',
    live: 'Live stock & visibility',
    product: 'Product',
    rate: 'Wholesale rate',
    rateSaved: 'Rate updated',
    rateError: 'Rate update failed',
    rateInvalid: 'Enter a valid rate',
    save: 'Save',
    cancel: 'Cancel',
    memo: 'New memo',
    stockStatus: 'Stock',
    actions: 'Adjust stock',
    status: 'Status',
    inStock: 'In stock',
    out: 'Out of stock',
    active: 'Active',
    hidden: 'Hidden',
    empty: 'No products found',
    pcs: 'pcs',
    allTab: 'All Products (সব)',
    inTab: 'In Stock (স্টকে আছে)',
    lowTab: 'Low Stock (< 10 pcs) (কম স্টক)',
    outTab: 'Out of Stock (0 pcs) (স্টক শেষ)',
    low: 'Low stock',
    changePhoto: 'Change photo',
    imageSaved: 'Image uploaded successfully',
    imageFailed: 'Image upload failed. Try again.',
    imageLarge: 'The image is still over 500 KB after compression.',
    imageHeic: 'This HEIC file could not be read. Use JPEG or PNG.',
    imageDecode: 'This image could not be read. Use JPEG, PNG, or HEIC.',
    imageData: 'Large images are not stored in the database. Upload a WebP.',
  },
};

const fieldClass =
  'h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-ink';

function RateEditor({ price, label, saveLabel, cancelLabel, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(price ?? ''));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setValue(String(price ?? ''));
  }, [price, editing]);

  async function commit() {
    if (saving) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) {
      onSave(null);
      return;
    }
    if (next === Number(price)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-base font-extrabold text-ink transition-all duration-200 ease-out hover:bg-slate-50"
      >
        ৳{price}
        <span className="text-xs font-bold text-slate-400" aria-hidden="true">✎</span>
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <input
        autoFocus
        type="number"
        min="0"
        step="1"
        value={value}
        aria-label={label}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onBlur={commit}
        className="h-11 w-24 rounded-xl border border-slate-200 bg-white px-2 text-right text-sm font-bold outline-none focus:border-ink"
      />
      <button
        type="button"
        aria-label={saveLabel}
        onMouseDown={(e) => e.preventDefault()}
        onClick={commit}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white"
      >
        ✓
      </button>
      <button
        type="button"
        aria-label={cancelLabel}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setEditing(false)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
      >
        ✕
      </button>
    </div>
  );
}

function stockBand(product) {
  const stock = Number(product?.stock) || 0;
  if (stock <= 0) return 'out';
  if (stock < 10) return 'low';
  return 'in';
}

function ThumbEditor({ product, label, busy, percent, onPick }) {
  return (
    <label className="group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <img
        src={product.image_url || '/wheels.png'}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      <span className={`pointer-events-none absolute inset-0 flex items-end justify-center bg-ink/75 px-1 py-1 text-center text-[9px] font-extrabold leading-tight text-white ${busy ? 'opacity-100' : 'opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100'}`}>
        {busy ? (
          <span className="flex w-full flex-col items-center gap-0.5 pb-0.5">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {percent}%
          </span>
        ) : label}
      </span>
      <input
        type="file"
        accept="image/*,.heic,.heif"
        disabled={busy}
        className="sr-only"
        onChange={(event) => {
          const file = imageFileFromList(event.target.files);
          event.target.value = '';
          if (file) onPick(product, file);
        }}
      />
    </label>
  );
}

function StockActions({ onAdjust }) {
  const steps = [
    { amount: -10, className: 'border-red-200 bg-red-50 text-red-800' },
    { amount: -1, className: 'border-stone-200 bg-white text-ink' },
    { amount: 1, className: 'border-stone-200 bg-white text-ink' },
    { amount: 10, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    { amount: 50, className: 'border-sky-200 bg-sky-50 text-sky-800' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step) => (
        <button
          key={step.amount}
          type="button"
          onClick={() => onAdjust(step.amount)}
          className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-all duration-200 ${step.className}`}
        >
          {step.amount > 0 ? `+${step.amount}` : step.amount}
        </button>
      ))}
    </div>
  );
}

export default function AdminProducts() {
  const { lang } = useLanguage();
  const t = copy[lang] || copy.bn;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoJob, setPhotoJob] = useState(null);
  const photoLock = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const stockFilter = ['in', 'low', 'out'].includes(searchParams.get('stock')) ? searchParams.get('stock') : 'all';
  useLiveStock(setProducts);

  const fetchData = async () => {
    setLoading(true);

    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) setCategories(catData);

    const { data: prodData } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (prodData) setProducts(prodData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const savePrice = async (productId, nextPrice) => {
    const current = products.find((item) => item.id === productId);
    const previous = current?.price;
    if (nextPrice == null || !Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error(t.rateInvalid);
      return false;
    }
    setProducts((rows) => rows.map((item) => (item.id === productId ? { ...item, price: nextPrice } : item)));
    const { error } = await supabase.from('products').update({ price: nextPrice }).eq('id', productId);
    if (error) {
      setProducts((rows) => rows.map((item) => (item.id === productId ? { ...item, price: previous } : item)));
      toast.error(t.rateError);
      console.error(error);
      return false;
    }
    toast.success(t.rateSaved);
    return true;
  };

  const adjustStock = async (productId, currentStock, amount) => {
    const newStock = Math.max(0, (Number(currentStock) || 0) + amount);
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
    } else {
      toast.error(t.stockError + ': ' + error.message);
    }
  };

  const toggleActive = async (productId, currentStatus) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map((p) => (p.id === productId ? { ...p, is_active: !currentStatus } : p)));
      toast.success(lang === 'bn' ? 'দৃশ্যমানতা হালনাগাদ হয়েছে' : 'Visibility updated');
    } else {
      toast.error(error.message);
    }
  };

  const stockCounts = useMemo(() => {
    const counts = { all: products.length, in: 0, low: 0, out: 0 };
    products.forEach((product) => {
      const band = stockBand(product);
      if (band === 'out') counts.out += 1;
      else {
        counts.in += 1;
        if (band === 'low') counts.low += 1;
      }
    });
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const band = stockBand(product);
      if (stockFilter === 'out' && band !== 'out') return false;
      if (stockFilter === 'low' && band !== 'low') return false;
      if (stockFilter === 'in' && band === 'out') return false;
      if (needle && !productSearchText(product).includes(needle)) return false;
      return true;
    });
  }, [products, query, stockFilter]);

  const setStockFilter = (next) => {
    const params = new URLSearchParams(searchParams);
    if (!next || next === 'all') params.delete('stock');
    else params.set('stock', next);
    setSearchParams(params, { replace: true });
  };

  const replacePhoto = async (product, file) => {
    if (!file || photoLock.current) return;
    photoLock.current = true;
    setPhotoJob({ id: product.id, percent: 4 });
    const previous = product.image_url;
    try {
      const result = await uploadProductImage(file, (percent) => {
        setPhotoJob({ id: product.id, percent });
      });
      if (!result.url?.startsWith('http') || isInlineImageUrl(result.url)) {
        throw Object.assign(new Error('STORAGE'), { code: 'STORAGE' });
      }
      setProducts((rows) => rows.map((item) => (item.id === product.id ? { ...item, image_url: result.url } : item)));
      const { error } = await supabase.from('products').update({ image_url: result.url }).eq('id', product.id);
      if (error) {
        setProducts((rows) => rows.map((item) => (item.id === product.id ? { ...item, image_url: previous } : item)));
        toast.error(t.imageFailed);
        return;
      }
      toast.success(t.imageSaved);
    } catch (error) {
      const message = error?.code === 'TOO_LARGE'
        ? t.imageLarge
        : error?.code === 'HEIC'
          ? t.imageHeic
          : error?.code === 'DECODE' || error?.code === 'NOT_IMAGE' || error?.code === 'WEBP'
            ? t.imageDecode
            : t.imageFailed;
      toast.error(message);
    } finally {
      photoLock.current = false;
      setPhotoJob(null);
    }
  };

  const saveProduct = useCallback(async (payload) => {
    if (!payload.name || !Number.isFinite(payload.price) || !payload.category_id) {
      toast.error(t.required);
      return;
    }
    if (isInlineImageUrl(payload.image_url)) {
      toast.error(t.imageData);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...payload,
        product_code: payload.product_code || 'WHOLESALE',
        image_url: payload.image_url || '/wheels.png',
      };
      if (drawer?.id) {
        const previous = products.find((item) => item.id === drawer.id);
        setProducts((rows) => rows.map((item) => (item.id === drawer.id ? { ...item, ...body } : item)));
        const { data, error } = await updateProductRow(drawer.id, body);
        if (error) {
          if (previous) setProducts((rows) => rows.map((item) => (item.id === drawer.id ? previous : item)));
          toast.error(error.message);
        } else if (data) {
          setProducts((rows) => rows.map((item) => (item.id === data.id ? data : item)));
          toast.success(t.updated);
          setDrawer(null);
        }
      } else {
        const { data, error } = await insertProductRow(body);
        if (error) {
          toast.error(t.addError + ': ' + error.message);
        } else if (data) {
          setProducts((rows) => [data, ...rows]);
          toast.success(t.added);
          setDrawer(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(t.addError);
    } finally {
      setSubmitting(false);
    }
  }, [drawer, products, t]);

  const actionBtn =
    'inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold transition-all duration-200 hover:bg-sand';

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <AdminStockAlert lang={lang} />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <div>
            <BackButton fallback="/admin/orders" className="mb-3" />
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t.title}</h1>
            <p className="mt-1 text-sm text-stone-500">
              {t.total}: <strong>{products.length}</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/orders" className={actionBtn}>{t.orders}</Link>
            <Link to="/admin/pos" className={actionBtn}>{t.memo}</Link>
            <LanguageToggle />
            <button
              type="button"
              onClick={() => setDrawer({})}
              className="inline-flex min-h-11 items-center rounded-xl bg-brass px-4 text-xs font-bold text-white transition-all duration-150 transform-gpu active:scale-95"
            >
              {t.add}
            </button>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-xs font-bold text-white transition-all duration-200"
            >
              {t.refresh}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ['all', t.allTab],
            ['in', t.inTab],
            ['low', t.lowTab],
            ['out', t.outTab],
          ].map(([id, label]) => {
            const active = stockFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStockFilter(id)}
                className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all duration-150 transform-gpu active:scale-95 ${
                  active ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white text-ink'
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/15 text-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                  {stockCounts[id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-4">
          <input
            className={fieldClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchProducts}
          />
        </div>

        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="text-lg font-extrabold text-ink">{t.live}</h2>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200/80" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="p-4">
              <EmptyState icon="📦" title={t.empty} />
            </div>
          ) : (
            <>
              <div className="block space-y-3 p-4 md:hidden">
                {visibleProducts.map((p) => (
                    <article key={p.id} className="rounded-2xl border border-stone-200 bg-sand p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <ThumbEditor product={p} label={t.changePhoto} busy={photoJob?.id === p.id} percent={photoJob?.id === p.id ? photoJob.percent : 0} onPick={replacePhoto} />
                          <div className="min-w-0">
                          <h3 className="font-extrabold text-ink">{p.name}</h3>
                          <p className="mt-1 text-xs text-stone-500">{p.categories?.name || (lang === 'bn' ? 'হার্ডওয়্যার' : 'Hardware')} · {p.product_code || (lang === 'bn' ? 'পাইকারি' : 'Wholesale')}</p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            {[productSizes(p)[0], productSeries(p)].filter(Boolean).join(' · ') || '—'}
                          </p>
                          </div>
                        </div>
                        <RateEditor
                          price={p.price}
                          label={t.rate}
                          saveLabel={t.save}
                          cancelLabel={t.cancel}
                          onSave={(next) => savePrice(p.id, next)}
                        />
                      </div>
                      <p className={`mt-3 inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ${stockBand(p) === 'out' ? 'bg-red-100 text-red-800' : stockBand(p) === 'low' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                        {stockBand(p) === 'out' ? `${t.out} (0)` : stockBand(p) === 'low' ? `${t.low} (${p.stock} ${t.pcs})` : `${t.inStock} (${p.stock} ${t.pcs})`}
                      </p>
                      <div className="mt-3">
                        <StockActions onAdjust={(amount) => adjustStock(p.id, p.stock, amount)} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDrawer(p)}
                          className="inline-flex h-11 items-center rounded-xl bg-brass px-4 text-xs font-bold text-white transition-all duration-150 transform-gpu active:scale-95"
                        >
                          ✏️ {t.edit} / এডিট
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(p.id, p.is_active)}
                          className={`inline-flex h-11 items-center rounded-xl px-4 text-xs font-bold text-white transition-all duration-200 ${p.is_active ? 'bg-ink' : 'bg-stone-400'}`}
                        >
                          {p.is_active ? t.active : t.hidden}
                        </button>
                      </div>
                    </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="hidden w-full text-left text-sm md:table">
                  <thead>
                    <tr className="bg-sand text-[11px] font-bold uppercase tracking-wide text-stone-500">
                      <th className="px-5 py-3">{t.product}</th>
                      <th className="px-3 py-3">{t.category}</th>
                      <th className="px-3 py-3">{t.code}</th>
                      <th className="px-3 py-3 text-right">{t.rate}</th>
                      <th className="px-3 py-3 text-center">{t.stockStatus}</th>
                      <th className="px-3 py-3">{t.actions}</th>
                      <th className="px-5 py-3 text-center">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p) => (
                        <tr key={p.id} className="border-t border-stone-100">
                          <td className="px-5 py-3 font-bold text-ink">
                            <div className="flex items-center gap-3">
                              <ThumbEditor product={p} label={t.changePhoto} busy={photoJob?.id === p.id} percent={photoJob?.id === p.id ? photoJob.percent : 0} onPick={replacePhoto} />
                              <div>
                                <p>{p.name}</p>
                                <p className="text-[11px] font-semibold text-slate-500">
                                  {[productSizes(p)[0], productSeries(p)].filter(Boolean).join(' · ') || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-stone-500">{p.categories?.name || (lang === 'bn' ? 'হার্ডওয়্যার' : 'Hardware')}</td>
                          <td className="px-3 py-3">
                            <span className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600">
                              {p.product_code || (lang === 'bn' ? 'পাইকারি' : 'Wholesale')}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <RateEditor
                              price={p.price}
                              label={t.rate}
                              saveLabel={t.save}
                              cancelLabel={t.cancel}
                              onSave={(next) => savePrice(p.id, next)}
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ${stockBand(p) === 'out' ? 'bg-red-100 text-red-800' : stockBand(p) === 'low' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                              {stockBand(p) === 'out' ? `${t.out} (0)` : stockBand(p) === 'low' ? `${t.low} (${p.stock} ${t.pcs})` : `${t.inStock} (${p.stock} ${t.pcs})`}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => setDrawer(p)}
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-brass px-3 text-xs font-bold text-white transition-all duration-150 transform-gpu active:scale-95"
                              >
                                ✏️ {t.edit} / এডিট
                              </button>
                              <StockActions onAdjust={(amount) => adjustStock(p.id, p.stock, amount)} />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleActive(p.id, p.is_active)}
                              className={`inline-flex h-11 items-center rounded-xl px-4 text-xs font-bold text-white transition-all duration-200 ${p.is_active ? 'bg-ink' : 'bg-stone-400'}`}
                            >
                              {p.is_active ? t.active : t.hidden}
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
      {drawer && (
        <ProductFormDrawer
          lang={lang}
          product={drawer.id ? drawer : null}
          categories={categories}
          submitting={submitting}
          onClose={() => setDrawer(null)}
          onSubmit={saveProduct}
        />
      )}
    </div>
  );
}
