import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { BackButton } from '../../components/BackButton';
import { LanguageToggle } from '../../components/LanguageToggle';
import { formatTaka } from '../../lib/format';
import { needsTransactionId, paymentMethodLabel } from '../../lib/paymentConfig';
import { productSearchText, productSeries, productSizes } from '../../lib/productMeta';

const copy = {
  bn: {
    title: 'নতুন মেমো / অফলাইন অর্ডার',
    orders: 'অর্ডার ব্যবস্থাপনা',
    products: 'পণ্য ও মজুদ',
    search: 'নাম, সাইজ বা সিরিজ লিখে খুঁজুন',
    add: 'যোগ করুন',
    emptyMemo: 'মেমোতে এখনো কোনো পণ্য নেই।',
    noMatch: 'এই নামে কোনো পণ্য নেই।',
    item: 'পণ্য',
    meta: 'সাইজ / সিরিজ',
    rate: 'এই মেমোর দর',
    qty: 'পরিমাণ',
    line: 'মোট',
    remove: 'সরান',
    customer: 'গ্রাহকের নাম',
    phone: 'ফোন নম্বর',
    address: 'ঠিকানা / নোট',
    payment: 'পেমেন্ট পদ্ধতি',
    total: 'সর্বমোট',
    save: 'মেমো সংরক্ষণ করুন',
    saving: 'সংরক্ষণ হচ্ছে...',
    saved: 'অফলাইন মেমো সংরক্ষণ হয়েছে',
    failed: 'মেমো সংরক্ষণ হয়নি',
    stockFailed: 'স্টক কমানো যায়নি। মেমো বাতিল করা হয়েছে।',
    phoneMissing: 'ফোন নম্বর লিখুন।',
    empty: 'অন্তত একটি পণ্য যোগ করুন।',
    tracking: 'মেমো নম্বর',
    another: 'আরেকটি মেমো',
    print: 'চালান ছাপুন',
    trx: 'লেনদেন নম্বর',
    sender: 'প্রেরকের নম্বর',
  },
  en: {
    title: 'New memo / offline order',
    orders: 'Orders',
    products: 'Products',
    search: 'Search by name, size, or series',
    add: 'Add',
    emptyMemo: 'This memo has no items yet.',
    noMatch: 'No products match that search.',
    item: 'Product',
    meta: 'Size / series',
    rate: 'Rate for this memo',
    qty: 'Qty',
    line: 'Total',
    remove: 'Remove',
    customer: 'Customer name',
    phone: 'Phone',
    address: 'Address / note',
    payment: 'Payment method',
    total: 'Grand total',
    save: 'Save memo',
    saving: 'Saving...',
    saved: 'Offline memo saved',
    failed: 'The memo could not be saved',
    stockFailed: 'Stock could not be updated. The memo was not saved.',
    phoneMissing: 'Enter a phone number.',
    empty: 'Add at least one product.',
    tracking: 'Memo number',
    another: 'New memo',
    print: 'Print memo',
    trx: 'Transaction ID',
    sender: 'Sender number',
  },
};

const METHODS = ['offline', 'bkash', 'bank'];

function metaLabel(line) {
  return [line.size, line.series].filter(Boolean).join(' · ');
}

export default function AdminPos() {
  const { lang } = useLanguage();
  const t = copy[lang] || copy.bn;
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [method, setMethod] = useState('offline');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, stock, image_url, product_code, product_variants(id, size, price)')
        .eq('is_active', true)
        .order('name');
      if (!cancelled) setProducts(data || []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? products.filter((product) => productSearchText(product).includes(needle))
      : products;
    return pool.slice(0, 12);
  }, [products, query]);

  const total = lines.reduce((sum, line) => sum + Number(line.unitPrice || 0) * line.quantity, 0);
  const field = 'h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-sm outline-none focus:border-ink';

  function addProduct(product) {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [
        ...current,
        {
          key: product.id,
          productId: product.id,
          variantId: null,
          title: product.name,
          size: productSizes(product)[0] || '',
          series: productSeries(product),
          unitPrice: Number(product.price) || 0,
          quantity: 1,
          image: product.image_url || '',
          productCode: product.product_code || '',
        },
      ];
    });
  }

  function updateLine(key, patch) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function restoreStock(updates) {
    await Promise.all(updates.map((row) => supabase.from('products').update({ stock: row.previous }).eq('id', row.id)));
  }

  async function saveMemo(event) {
    event.preventDefault();
    if (!lines.length) {
      toast.error(t.empty);
      return;
    }
    if (!phone.trim()) {
      toast.error(t.phoneMissing);
      return;
    }

    setSubmitting(true);
    const ids = [...new Set(lines.map((line) => line.productId))];
    const { data: stockRows, error: stockReadError } = await supabase.from('products').select('id, stock').in('id', ids);
    if (stockReadError || !stockRows) {
      toast.error(t.stockFailed);
      setSubmitting(false);
      return;
    }

    const stockMap = Object.fromEntries(stockRows.map((row) => [row.id, Number(row.stock) || 0]));
    const qtyMap = {};
    lines.forEach((line) => {
      qtyMap[line.productId] = (qtyMap[line.productId] || 0) + line.quantity;
    });
    const updates = Object.entries(qtyMap).map(([id, quantity]) => ({
      id,
      previous: stockMap[id] ?? 0,
      next: (stockMap[id] ?? 0) - quantity,
    }));

    const applied = [];
    for (const row of updates) {
      const { error } = await supabase.from('products').update({ stock: row.next }).eq('id', row.id);
      if (error) {
        await restoreStock(applied);
        toast.error(t.stockFailed);
        console.error(error);
        setSubmitting(false);
        return;
      }
      applied.push(row);
    }

    const items = lines.map((line) => ({
      key: line.key,
      productId: line.productId,
      variantId: line.variantId,
      title: line.title,
      unitPrice: Number(line.unitPrice) || 0,
      quantity: line.quantity,
      productCode: line.productCode,
      image: line.image,
      size: line.size,
      series: line.series,
      stockApplied: true,
    }));
    const amount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const orderNumber = `MEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data: sessionData } = await supabase.auth.getSession();
    const prepaid = needsTransactionId(method);
    const payload = {
      order_number: orderNumber,
      user_id: sessionData?.session?.user?.id || null,
      customer_name: name.trim() || (lang === 'bn' ? 'অফলাইন ক্রেতা' : 'Offline customer'),
      phone: phone.trim(),
      shop_name: name.trim() || (lang === 'bn' ? 'অফলাইন মেমো' : 'Offline memo'),
      delivery_address: address.trim() || null,
      subtotal: amount,
      total_amount: amount,
      status: 'confirmed',
      payment_method: method,
      payment_status: method === 'offline' ? 'verified' : 'pending',
      transaction_id: prepaid ? transactionId.trim() || null : null,
      sender_number: prepaid ? senderNumber.trim() || null : null,
      items,
    };

    let { data, error } = await supabase.from('orders').insert([payload]).select('order_number').single();
    if (error && /sender_number/i.test(error.message || '')) {
      const { sender_number: sentFrom, ...rest } = payload;
      rest.payment_reference = sentFrom || null;
      const retry = await supabase.from('orders').insert([rest]).select('order_number').single();
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      await restoreStock(applied);
      toast.error(t.failed);
      console.error(error);
      setSubmitting(false);
      return;
    }

    const memoNumber = data?.order_number || orderNumber;
    setSaved({ number: memoNumber, total: amount, items, name, phone, address, method });
    setLines([]);
    setTransactionId('');
    setSenderNumber('');
    toast.success(t.saved);
    setSubmitting(false);
  }

  function printMemo() {
    if (!saved) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${saved.number}</title>
      <style>body{font-family:sans-serif;padding:24px;color:#0f172a} table{width:100%;border-collapse:collapse} td,th{border:1px solid #e2e8f0;padding:8px;text-align:left} .total{text-align:right;font-size:18px;font-weight:700}</style>
      </head><body>
      <h1>ইউসুফ এন্টারপ্রাইজ</h1>
      <p>${t.tracking}: ${saved.number}<br/>${saved.name || ''} · ${saved.phone || ''}<br/>${saved.address || ''}</p>
      <table><thead><tr><th>${t.item}</th><th>${t.qty}</th><th>${t.line}</th></tr></thead><tbody>
      ${saved.items.map((item) => `<tr><td>${item.title}</td><td>${item.quantity}</td><td>৳${item.unitPrice * item.quantity}</td></tr>`).join('')}
      </tbody></table>
      <p class="total">${t.total}: ৳${saved.total}</p>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <div>
            <BackButton fallback="/admin/orders" className="mb-3" />
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/orders" className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold">{t.orders}</Link>
            <Link to="/admin/products" className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold">{t.products}</Link>
            <LanguageToggle />
          </div>
        </div>

        {saved ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-sm">
            <h2 className="text-2xl font-extrabold text-ink">{t.saved}</h2>
            <p className="mt-2 text-sm text-slate-500">{t.tracking}: <strong>{saved.number}</strong></p>
            <p className="mt-1 text-xl font-extrabold">{formatTaka(saved.total, lang)}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={printMemo} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold">{t.print}</button>
              <button type="button" onClick={() => setSaved(null)} className="h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white">{t.another}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={saveMemo} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <input className={field} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} />
              <ul className="mt-3 divide-y divide-slate-100">
                {results.length === 0 && <li className="py-6 text-center text-sm text-slate-500">{t.noMatch}</li>}
                {results.map((product) => {
                  const meta = [productSizes(product)[0], productSeries(product)].filter(Boolean).join(' · ');
                  return (
                    <li key={product.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{product.name}</p>
                        <p className="text-xs text-slate-500">{meta || '—'} · {formatTaka(product.price, lang)}</p>
                      </div>
                      <button type="button" onClick={() => addProduct(product)} className="inline-flex h-11 items-center rounded-xl bg-ink px-3 text-xs font-bold text-white">
                        + {t.add}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              {lines.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">{t.emptyMemo}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {lines.map((line) => (
                    <li key={line.key} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]">
                      <div>
                        <p className="text-sm font-bold text-ink">{line.title}</p>
                        <p className="text-xs text-slate-500">{metaLabel(line) || '—'}</p>
                        <button type="button" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} className="mt-1 text-xs font-bold text-red-600">
                          {t.remove}
                        </button>
                      </div>
                      <label className="text-[11px] font-bold text-slate-500">
                        {t.rate}
                        <input
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                          className={`${field} mt-1`}
                        />
                      </label>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500">{t.qty}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" onClick={() => updateLine(line.key, { quantity: Math.max(1, line.quantity - 1) })}>−</button>
                          <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}>+</button>
                        </div>
                        <p className="mt-1 text-right text-sm font-extrabold">{formatTaka(line.unitPrice * line.quantity, lang)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 grid gap-2">
                <input className={field} placeholder={t.customer} value={name} onChange={(e) => setName(e.target.value)} />
                <input className={field} required placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className={field} placeholder={t.address} value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <p className="mb-2 mt-4 text-xs font-bold text-slate-500">{t.payment}</p>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    className={`min-h-11 rounded-xl border px-2 text-xs font-bold ${method === id ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white text-ink'}`}
                  >
                    {paymentMethodLabel(id, lang)}
                  </button>
                ))}
              </div>
              {needsTransactionId(method) && (
                <div className="mt-3 grid gap-2">
                  <input className={field} placeholder={t.trx} value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                  <input className={field} placeholder={t.sender} value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{t.total}</span>
                <span className="text-xl font-extrabold">{formatTaka(total, lang)}</span>
              </div>
              <button type="submit" disabled={submitting} className="mt-3 h-12 w-full rounded-2xl bg-brass text-sm font-bold text-white disabled:bg-slate-400">
                {submitting ? t.saving : t.save}
              </button>
            </section>
          </form>
        )}
      </div>
    </div>
  );
}
