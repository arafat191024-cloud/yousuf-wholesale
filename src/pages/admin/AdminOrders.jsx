import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { BackButton } from '../../components/BackButton';
import { LanguageToggle } from '../../components/LanguageToggle';
import { orderStatusLabel } from '../../lib/format';
import {
  isPaymentFailed,
  isPaymentVerified,
  normalizePaymentStatus,
  paymentMethodLabel,
} from '../../lib/paymentConfig';

export default function AdminOrders() {
  const { lang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsStock, setProductsStock] = useState({});

  const [editingOrder, setEditingOrder] = useState(null);

  const labels = {
    bn: {
      title: 'পাইকারি অর্ডার ব্যবস্থাপনা',
      totalOrders: 'মোট অর্ডার:',
      refresh: 'হালনাগাদ',
      searchPlaceholder: 'দোকান, ফোন, অর্ডার বা লেনদেন নম্বর',
      filterAll: 'সব',
      filterPending: 'অপেক্ষমাণ',
      filterApproved: 'অনুমোদিত',
      filterDelivered: 'পৌঁছেছে',
      filterCancelled: 'বাতিল',
      noOrders: 'কোনো অর্ডার পাওয়া যায়নি।',
      dailySale: 'আজকের বিক্রি',
      monthlySale: 'এই মাসের বিক্রি',
      cashCollection: 'জমা টাকা',
      totalSale: 'মোট বিক্রি',
      customer: 'ক্রেতার তথ্য',
      call: 'কল',
      whatsapp: 'হোয়াটসঅ্যাপ',
      print: 'চালান ছাপুন',
      edit: 'সম্পাদনা',
      editLocked: 'সম্পাদনা বন্ধ',
      save: 'সংরক্ষণ',
      close: 'বন্ধ',
      paymentMethod: 'পেমেন্ট পদ্ধতি',
      paymentStatus: 'পেমেন্ট অবস্থা',
      markPaid: 'পরিশোধিত চিহ্নিত করুন',
      markUnpaid: 'অপরিশোধিত করুন',
      paidLabel: 'পরিশোধিত',
      unpaidLabel: 'অপরিশোধিত',
      markFailed: 'ব্যর্থ',
      stockStatus: 'বর্তমান মজুদ',
      inStock: 'স্টকে আছে',
      stockOut: 'স্টক নেই',
      trxId: 'লেনদেন নম্বর',
      copy: 'কপি',
      copied: 'কপি হয়েছে',
      receipt: 'রসিদ নম্বর',
      products: 'পণ্য ও মজুদ',
      memo: 'নতুন মেমো',
      sender: 'প্রেরকের নম্বর',
      shop: 'দোকান',
      deliveredWarn: 'এই অর্ডার ইতিমধ্যে পৌঁছে গেছে। অবস্থা বদলাতে চান?',
      cancelWarn: 'এই অর্ডার বাতিল করতে চান?',
      deliveredLock: 'পৌঁছে যাওয়া অর্ডার সম্পাদনা করা যায় না।',
      payUpdated: 'পেমেন্ট অবস্থা হালনাগাদ হয়েছে',
      updateFailed: 'হালনাগাদ হয়নি',
      productCol: 'পণ্য',
      rateCol: 'দর',
      qtyCol: 'পরিমাণ',
      totalCol: 'মোট',
    },
    en: {
      title: 'Wholesale order desk',
      totalOrders: 'Total orders:',
      refresh: 'Refresh',
      searchPlaceholder: 'Shop, phone, order or transaction ID',
      filterAll: 'All',
      filterPending: 'Pending',
      filterApproved: 'Approved',
      filterDelivered: 'Delivered',
      filterCancelled: 'Cancelled',
      noOrders: 'No orders found.',
      dailySale: 'Sales today',
      monthlySale: 'Sales this month',
      cashCollection: 'Collected',
      totalSale: 'All-time sales',
      customer: 'Customer',
      call: 'Call',
      whatsapp: 'WhatsApp',
      print: 'Print memo',
      edit: 'Edit',
      editLocked: 'Editing locked',
      save: 'Save',
      close: 'Close',
      paymentMethod: 'Payment method',
      paymentStatus: 'Payment status',
      markPaid: 'Mark paid',
      markUnpaid: 'Mark unpaid',
      paidLabel: 'Paid',
      unpaidLabel: 'Unpaid',
      markFailed: 'Failed',
      stockStatus: 'Live stock',
      inStock: 'In stock',
      stockOut: 'Out of stock',
      trxId: 'Transaction ID',
      copy: 'Copy',
      copied: 'Copied',
      receipt: 'Receipt reference',
      products: 'Products and stock',
      memo: 'New memo',
      sender: 'Sender number',
      shop: 'Shop',
      deliveredWarn: 'This order is already delivered. Change the status?',
      cancelWarn: 'Cancel this order?',
      deliveredLock: 'Delivered orders cannot be edited.',
      payUpdated: 'Payment status updated',
      updateFailed: 'Update failed',
      productCol: 'Product',
      rateCol: 'Rate',
      qtyCol: 'Qty',
      totalCol: 'Total',
    }
  };

  const t = labels[lang] || labels.bn;

  const fetchData = async () => {
    setLoading(true);
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orderData) setOrders(orderData);

    const { data: prodData } = await supabase
      .from('products')
      .select('id, name, stock, product_variants(id, size, stock)');

    if (prodData) {
      const stockMap = {};
      prodData.forEach(p => {
        stockMap[p.id] = {
          totalStock: Number(p.stock) || 100,
          variants: (p.product_variants || []).reduce((acc, v) => {
            acc[v.id] = Number(v.stock) || 50;
            return acc;
          }, {})
        };
      });
      setProductsStock(stockMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateOrderField = async (orderId, fields) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    if (targetOrder.status === 'delivered' && fields.status !== undefined && fields.status !== 'delivered') {
      const confirmRevert = window.confirm(t.deliveredWarn);
      if (!confirmRevert) return;
    }

    if (fields.status === 'cancelled') {
      const confirmCancel = window.confirm(`${t.cancelWarn} #${targetOrder.order_number || ''}`);
      if (!confirmCancel) return;
    }

    const { error } = await supabase
      .from('orders')
      .update(fields)
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...fields } : o)));
      if (fields.payment_status) {
        toast.success(t.payUpdated);
      }
    } else {
      toast.error(t.updateFailed);
      console.error(error);
    }
  };

  // Dynamic live stock calculate
  const calculatedStock = useMemo(() => {
    const liveMap = JSON.parse(JSON.stringify(productsStock));

    orders.forEach((order) => {
      if (order.status !== 'cancelled' && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.stockApplied) return
          if (item.productId && liveMap[item.productId]) {
            if (item.variantId && liveMap[item.productId].variants?.[item.variantId] !== undefined) {
              liveMap[item.productId].variants[item.variantId] -= Number(item.quantity) || 0;
            } else {
              liveMap[item.productId].totalStock -= Number(item.quantity) || 0;
            }
          }
        });
      }
    });

    return liveMap;
  }, [productsStock, orders]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = new Date().toISOString().slice(0, 7);

    let daily = 0;
    let monthly = 0;
    let cashCollected = 0;
    let totalLifetime = 0;

    orders.forEach((o) => {
      const amt = Number(o.total_amount) || 0;
      if (o.status?.toLowerCase() === 'cancelled') return;

      totalLifetime += amt;

      const orderDate = o.created_at ? new Date(o.created_at).toISOString() : '';
      if (orderDate.startsWith(today)) {
        daily += amt;
      }
      if (orderDate.startsWith(currentMonth)) {
        monthly += amt;
      }
      if (isPaymentVerified(o.payment_status)) {
        cashCollected += amt;
      }
    });

    return { daily, monthly, cashCollected, totalLifetime };
  }, [orders]);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'all' ? true : o.status?.toLowerCase() === activeFilter.toLowerCase();

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (o.shop_name && o.shop_name.toLowerCase().includes(query)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.phone && o.phone.includes(query)) ||
      (o.order_number && o.order_number.toLowerCase().includes(query)) ||
      (o.transaction_id && o.transaction_id.toLowerCase().includes(query)) ||
      (o.sender_number && o.sender_number.includes(query));

    return matchesFilter && matchesSearch;
  });

  const copyTrx = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.copied);
    } catch {
      toast.error(lang === 'bn' ? 'কপি করা যায়নি' : 'Could not copy');
    }
  };

  const handlePrintMemo = (order) => {
    const printWindow = window.open('', '_blank');
    const items = Array.isArray(order.items) ? order.items : [];
    const paidLabel = isPaymentVerified(order.payment_status) ? 'VERIFIED' : (isPaymentFailed(order.payment_status) ? 'FAILED' : 'PENDING');
    printWindow.document.write(`
      <html>
        <head>
          <title>Memo #${order.order_number || String(order.id).slice(0, 8)}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
            .title { font-size: 22px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .info-box { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; }
            th { background: #f8fafc; text-align: left; }
            .text-right { text-align: right; }
            .total { font-size: 16px; font-weight: bold; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ইউসুফ এন্টারপ্রাইজ (Yousuf Enterprise)</h1>
            <div class="subtitle">কারওয়ান বাজার, ঢাকা | মোবাইল: 01922427586</div>
          </div>
          <div class="info-box">
            <div>
              <strong>দোকানের নাম:</strong> ${order.shop_name || 'N/A'}<br/>
              <strong>প্রোপ্রাইটর:</strong> ${order.customer_name || 'Wholesale Client'}<br/>
              <strong>ফোন:</strong> ${order.phone}
            </div>
            <div style="text-align: right;">
              <strong>মেমো নং:</strong> #${order.order_number || String(order.id).slice(0, 8)}<br/>
              <strong>তারিখ:</strong> ${new Date(order.created_at).toLocaleDateString('bn-BD')}<br/>
              <strong>পেমেন্ট:</strong> ${order.payment_method?.toUpperCase()} (${paidLabel})<br/>
              <strong>${t.trxId}:</strong> ${order.transaction_id || '—'}<br/>
              <strong>${t.sender}:</strong> ${order.sender_number || '—'}<br/>
              <strong>অবস্থা:</strong> ${order.status?.toUpperCase()}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ক্রমিক</th>
                <th>পণ্যের বিবরণ</th>
                <th class="text-right">দর (টাকা)</th>
                <th style="text-align:center">পরিমাণ</th>
                <th class="text-right">মোট টাকা</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${it.title}</td>
                  <td class="text-right">৳${it.unitPrice}</td>
                  <td style="text-align:center">${it.quantity} পিস</td>
                  <td class="text-right">৳${it.unitPrice * it.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">সর্বমোট বিল: ৳${order.total_amount} (${isPaymentVerified(order.payment_status) ? 'পরিশোধিত' : 'বকেয়া'})</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleOpenEdit = (order) => {
    if (order.status === 'delivered') {
      alert(t.deliveredLock);
      return;
    }
    setEditingOrder({
      ...order,
      payment_status: normalizePaymentStatus(order.payment_status),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    const recalculatedTotal = editingOrder.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const updated = {
      customer_name: editingOrder.customer_name,
      shop_name: editingOrder.shop_name,
      phone: editingOrder.phone,
      payment_method: editingOrder.payment_method,
      payment_status: normalizePaymentStatus(editingOrder.payment_status),
      transaction_id: editingOrder.transaction_id || null,
      sender_number: editingOrder.sender_number || null,
      payment_reference: editingOrder.payment_reference || null,
      items: editingOrder.items,
      total_amount: recalculatedTotal
    };
    await updateOrderField(editingOrder.id, updated);
    setEditingOrder(null);
  };

  const actionBtn = 'inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold transition-all duration-200 hover:bg-sand';

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <div>
            <BackButton fallback="/" className="mb-3" />
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{t.title}</h1>
            <p className="mt-1 text-sm text-stone-500">
              {t.totalOrders} <strong>{orders.length}</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/memo" className={actionBtn}>{lang === 'bn' ? 'নতুন মেমো' : 'New memo'}</Link>
            <Link to="/admin/products" className={actionBtn}>{t.products}</Link>
            <Link to="/admin/pos" className={actionBtn}>{t.memo}</Link>
            <LanguageToggle />
            <button type="button" onClick={fetchData} className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-xs font-bold text-white transition-all duration-200">
              {t.refresh}
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [t.dailySale, metrics.daily, 'text-teal-700'],
            [t.monthlySale, metrics.monthly, 'text-blue-700'],
            [t.cashCollection, metrics.cashCollected, 'text-emerald-700'],
            [t.totalSale, metrics.totalLifetime, 'text-ink'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-stone-500">{label}</div>
              <div className={`mt-2 text-xl font-extrabold ${color}`}>৳{value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: t.filterAll },
              { id: 'pending', label: t.filterPending },
              { id: 'approved', label: t.filterApproved },
              { id: 'delivered', label: t.filterDelivered },
              { id: 'cancelled', label: t.filterCancelled }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`min-h-11 rounded-full px-4 text-xs font-bold transition-all duration-200 ${
                  activeFilter === tab.id ? 'bg-ink text-white' : 'border border-stone-200 bg-white text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-ink md:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-stone-200/80" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white px-6 py-14 text-center text-sm text-stone-500 shadow-sm">
            {t.noOrders}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const verified = isPaymentVerified(order.payment_status);
              const failed = isPaymentFailed(order.payment_status);
              const isDelivered = order.status === 'delivered';

              return (
                <article key={order.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-teal-700">#{order.order_number || String(order.id).slice(0, 8)}</span>
                          <span className="text-xs text-stone-500">{new Date(order.created_at).toLocaleDateString('bn-BD')}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${verified ? 'bg-emerald-100 text-emerald-800' : failed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                            {verified ? t.paidLabel : failed ? t.markFailed : t.unpaidLabel} · {paymentMethodLabel(order.payment_method, lang)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
                            {orderStatusLabel(order.status, lang)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-extrabold text-ink">{order.shop_name || order.customer_name}</h3>
                        <div className="text-sm font-semibold text-blue-700">📞 {order.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-ink">৳{Number(order.total_amount || 0).toLocaleString()}</div>
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <a href={`tel:${order.phone}`} className={actionBtn}>{t.call}</a>
                          <a href={`https://wa.me/88${order.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-500 px-3 text-xs font-bold text-white">{t.whatsapp}</a>
                          <button type="button" onClick={() => handleOpenEdit(order)} disabled={isDelivered} className={`${actionBtn} disabled:cursor-not-allowed disabled:text-stone-400`}>
                            {isDelivered ? t.editLocked : t.edit}
                          </button>
                          <button type="button" onClick={() => handlePrintMemo(order)} className={actionBtn}>{t.print}</button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-stone-200 bg-sand p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t.paymentMethod}</p>
                      <p className="mt-1 text-sm font-extrabold text-ink">{paymentMethodLabel(order.payment_method, lang)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink">
                          {t.trxId}: {order.transaction_id || '—'}
                        </span>
                        {order.transaction_id && (
                          <button
                            type="button"
                            onClick={() => copyTrx(order.transaction_id)}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-ink px-3 text-xs font-bold text-white transition-all duration-200"
                          >
                            {t.copy}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink">
                          {t.sender}: {order.sender_number || '—'}
                        </span>
                        {order.sender_number && (
                          <button
                            type="button"
                            onClick={() => copyTrx(order.sender_number)}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-ink"
                          >
                            {t.copy}
                          </button>
                        )}
                      </div>
                      {order.payment_reference && (
                        <p className="mt-1 text-xs text-stone-600">{t.receipt}: {order.payment_reference}</p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-stone-200 pt-3">
                      <button
                        type="button"
                        onClick={() => updateOrderField(order.id, { payment_status: verified ? 'pending' : 'verified' })}
                        className={`min-h-11 rounded-xl px-3 text-xs font-bold transition-all duration-200 ${verified ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}
                      >
                        {verified ? t.markUnpaid : t.markPaid}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrderField(order.id, { payment_status: 'failed' })}
                        className="min-h-11 rounded-xl border border-stone-200 px-3 text-xs font-bold text-stone-600 transition-all duration-200"
                      >
                        {t.markFailed}
                      </button>
                      <span className="mx-1 hidden h-4 w-px bg-stone-300 sm:inline-block" />
                      {['pending', 'approved', 'delivered', 'cancelled'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateOrderField(order.id, { status: st })}
                          className={`min-h-11 rounded-xl px-3 text-xs font-bold transition-all duration-200 ${order.status === st ? 'bg-ink text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
                        >
                          {orderStatusLabel(st, lang)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="block divide-y divide-stone-100 border-t border-stone-100 md:hidden">
                    {items.map((item, idx) => {
                      const prodInfo = calculatedStock[item.productId];
                      const remainingStock = item.variantId
                        ? (prodInfo?.variants?.[item.variantId] ?? 25)
                        : (prodInfo?.totalStock ?? 60);
                      const isShortStock = remainingStock <= 0;
                      return (
                        <div key={idx} className="space-y-1 px-4 py-3 text-sm">
                          <p className="font-bold text-ink">{item.title}</p>
                          <p className="text-stone-600">৳{item.unitPrice} × {item.quantity} {lang === 'bn' ? 'পিস' : 'pcs'}</p>
                          <p className={isShortStock ? 'text-xs font-bold text-red-700' : 'text-xs font-semibold text-emerald-700'}>
                            {isShortStock ? `${t.stockOut} (${remainingStock})` : `✓ ${t.inStock} (${remainingStock})`}
                          </p>
                          <p className="font-extrabold">৳{(item.unitPrice * item.quantity).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden overflow-x-auto border-t border-stone-100 md:block">
                    <table className="hidden w-full text-left text-sm md:table">
                      <thead>
                        <tr className="bg-sand text-[11px] uppercase tracking-wide text-stone-500">
                          <th className="px-5 py-3">{t.productCol}</th>
                          <th className="px-3 py-3 text-right">{t.rateCol}</th>
                          <th className="px-3 py-3 text-center">{t.qtyCol}</th>
                          <th className="px-3 py-3 text-center">{t.stockStatus}</th>
                          <th className="px-5 py-3 text-right">{t.totalCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const prodInfo = calculatedStock[item.productId];
                          const remainingStock = item.variantId
                            ? (prodInfo?.variants?.[item.variantId] ?? 25)
                            : (prodInfo?.totalStock ?? 60);
                          const isShortStock = remainingStock <= 0;
                          return (
                            <tr key={idx} className="border-t border-stone-100">
                              <td className="px-5 py-3 font-semibold text-ink">{item.title}</td>
                              <td className="px-3 py-3 text-right">৳{item.unitPrice}</td>
                              <td className="px-3 py-3 text-center font-bold">{item.quantity}</td>
                              <td className={`px-3 py-3 text-center text-xs font-bold ${isShortStock ? 'bg-red-50 text-red-700' : 'text-emerald-700'}`}>
                                {isShortStock ? `${t.stockOut} (${remainingStock})` : `✓ ${t.inStock} (${remainingStock})`}
                              </td>
                              <td className="px-5 py-3 text-right font-bold">৳{(item.unitPrice * item.quantity).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {editingOrder && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 transition-all duration-200">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
              <h3 className="text-lg font-extrabold text-ink">#{editingOrder.order_number}</h3>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  className="h-11 rounded-xl border border-stone-200 px-3 text-sm"
                  value={editingOrder.shop_name || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, shop_name: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-stone-200 px-3 text-sm"
                  value={editingOrder.phone || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={editingOrder.payment_method || 'cod'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, payment_method: e.target.value })}
                    className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
                  >
                    <option value="cod">{paymentMethodLabel('cod', lang)}</option>
                    <option value="bkash">{paymentMethodLabel('bkash', lang)}</option>
                    <option value="nagad">{paymentMethodLabel('nagad', lang)}</option>
                    <option value="bank">{paymentMethodLabel('bank', lang)}</option>
                  </select>
                  <select
                    value={normalizePaymentStatus(editingOrder.payment_status)}
                    onChange={(e) => setEditingOrder({ ...editingOrder, payment_status: e.target.value })}
                    className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
                  >
                    <option value="pending">{t.markUnpaid}</option>
                    <option value="verified">{t.markPaid}</option>
                    <option value="failed">{t.markFailed}</option>
                  </select>
                </div>
                <input
                  className="h-11 rounded-xl border border-stone-200 px-3 font-mono text-sm"
                  placeholder={t.trxId}
                  value={editingOrder.transaction_id || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, transaction_id: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-stone-200 px-3 text-sm"
                  placeholder={t.sender}
                  value={editingOrder.sender_number || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, sender_number: e.target.value })}
                />
                <input
                  className="h-11 rounded-xl border border-stone-200 px-3 text-sm"
                  placeholder={t.receipt}
                  value={editingOrder.payment_reference || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, payment_reference: e.target.value })}
                />
              </div>

              <div className="mt-4 border-t border-stone-100 pt-3">
                {(editingOrder.items || []).map((item, i) => (
                  <div key={i} className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{item.title}</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const updatedItems = [...editingOrder.items];
                        updatedItems[i] = { ...updatedItems[i], quantity: newQty };
                        setEditingOrder({ ...editingOrder, items: updatedItems });
                      }}
                      className="h-11 w-20 rounded-xl border border-stone-200 text-center text-sm font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingOrder(null)} className={actionBtn}>{t.close}</button>
                <button type="button" onClick={handleSaveEdit} className="inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-bold text-white">{t.save}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
