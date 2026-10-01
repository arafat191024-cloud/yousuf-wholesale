import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminOrders() {
  const { lang, setLang } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [productsStock, setProductsStock] = useState({});

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState(null);

  const labels = {
    bn: {
      title: 'পাইকারি অর্ডার ড্যাশবোর্ড (Yousuf Enterprise)',
      totalOrders: 'মোট অর্ডার:',
      refresh: '🔄 রিফ্রেশ',
      searchPlaceholder: 'দোকানের নাম, ফোন বা মেমো নং...',
      filterAll: 'সবগুলো',
      filterPending: 'অপেক্ষমান',
      filterApproved: 'অনুমোদিত',
      filterDelivered: 'ডেলিভারড',
      filterCancelled: 'বাতিল',
      noOrders: 'কোনো অর্ডার পাওয়া যায়নি।',
      dailySale: 'আজকের বিক্রি (Daily)',
      monthlySale: 'চলতি মাসের বিক্রি (Monthly)',
      cashCollection: 'ক্যাশ কালেকশন (Paid)',
      totalSale: 'সর্বমোট বিক্রি (Lifetime)',
      customer: 'ক্রেতার বিবরণ',
      call: '📞 কল দিন',
      whatsapp: '💬 WhatsApp',
      print: '🖨 চালান প্রিন্ট',
      edit: '✏️ এডিট',
      editLocked: '🔒 লকড (ডেলিভারড)',
      save: 'সংরক্ষণ করুন',
      close: 'বন্ধ করুন',
      paymentMethod: 'পেমেন্ট মেথড',
      paymentStatus: 'পেমেন্ট স্ট্যাটাস',
      markPaid: '✓ Mark as Paid',
      markUnpaid: '⊘ Mark as Unpaid',
      stockStatus: 'লাইভ স্টক (অ্যাডমিন)',
      inStock: 'স্টকে আছে',
      stockOut: '⚠️ স্টক সংকট / আউট'
    },
    en: {
      title: 'Wholesale Orders Dashboard (Yousuf Enterprise)',
      totalOrders: 'Total Orders:',
      refresh: '🔄 Refresh',
      searchPlaceholder: 'Search by shop, phone, memo...',
      filterAll: 'All',
      filterPending: 'Pending',
      filterApproved: 'Approved',
      filterDelivered: 'Delivered',
      filterCancelled: 'Cancelled',
      noOrders: 'No orders found.',
      dailySale: 'Daily Sales',
      monthlySale: 'Monthly Sales',
      cashCollection: 'Cash Collected (Paid)',
      totalSale: 'Lifetime Sales',
      customer: 'Customer Info',
      call: '📞 Call',
      whatsapp: '💬 WhatsApp',
      print: '🖨 Print Memo',
      edit: '✏️ Edit',
      editLocked: '🔒 Locked (Delivered)',
      save: 'Save Changes',
      close: 'Close',
      paymentMethod: 'Payment Method',
      paymentStatus: 'Payment Status',
      markPaid: '✓ Mark as Paid',
      markUnpaid: '⊘ Mark as Unpaid',
      stockStatus: 'Live Stock (Admin)',
      inStock: 'In Stock',
      stockOut: '⚠️ Out of Stock'
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
      const confirmRevert = window.confirm(
        lang === 'bn' 
          ? 'এই অর্ডারটি ইতিমধ্যে Delivered করা হয়েছে। আপনি কি নিশ্চিত যে এর স্ট্যাটাস পরিবর্তন করতে চান?' 
          : 'This order is already Delivered. Are you sure you want to change its status?'
      );
      if (!confirmRevert) return;
    }

    if (fields.status === 'cancelled') {
      const confirmCancel = window.confirm(
        lang === 'bn'
          ? `আপনি কি নিশ্চিত যে অর্ডার #${targetOrder.order_number || ''} বাতিল (Cancel) করতে চান?`
          : `Are you sure you want to cancel order #${targetOrder.order_number || ''}?`
      );
      if (!confirmCancel) return;
    }

    const { error } = await supabase
      .from('orders')
      .update(fields)
      .eq('id', orderId);

    if (!error) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...fields } : o)));
    } else {
      alert('Error updating order: ' + error.message);
    }
  };

  // Dynamic live stock calculate
  const calculatedStock = useMemo(() => {
    const liveMap = JSON.parse(JSON.stringify(productsStock));

    orders.forEach((order) => {
      if (order.status !== 'cancelled' && Array.isArray(order.items)) {
        order.items.forEach((item) => {
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

  // Analytics
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
      if (o.payment_status === 'paid') {
        cashCollected += amt;
      }
    });

    return { daily, monthly, cashCollected, totalLifetime };
  }, [orders]);

  // Orders Filter (Only Status Filters)
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'all' ? true : o.status?.toLowerCase() === activeFilter.toLowerCase();

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (o.shop_name && o.shop_name.toLowerCase().includes(query)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.phone && o.phone.includes(query)) ||
      (o.order_number && o.order_number.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const handlePrintMemo = (order) => {
    const printWindow = window.open('', '_blank');
    const items = Array.isArray(order.items) ? order.items : [];
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
              <strong>পেমেন্ট:</strong> ${order.payment_method?.toUpperCase()} (${order.payment_status === 'paid' ? 'PAID' : 'UNPAID'})<br/>
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
          <div class="total">সর্বমোট বিল: ৳${order.total_amount} (${order.payment_status === 'paid' ? 'পরিশোধিত' : 'বকেয়া'})</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleOpenEdit = (order) => {
    if (order.status === 'delivered') {
      alert(
        lang === 'bn' 
          ? 'ডেলিভারড (Delivered) হওয়া অর্ডার সম্পাদনা (Edit) করা সম্ভব নয়।' 
          : 'Delivered orders cannot be edited.'
      );
      return;
    }
    setEditingOrder(order);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    const recalculatedTotal = editingOrder.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const updated = {
      customer_name: editingOrder.customer_name,
      shop_name: editingOrder.shop_name,
      phone: editingOrder.phone,
      payment_method: editingOrder.payment_method,
      payment_status: editingOrder.payment_status,
      items: editingOrder.items,
      total_amount: recalculatedTotal
    };
    await updateOrderField(editingOrder.id, updated);
    setEditingOrder(null);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          background: '#ffffff',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              {t.title}
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              {t.totalOrders} <strong>{orders.length}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
            >
              🌐 {lang === 'bn' ? 'English Version' : 'বাংলা ভার্সন'}
            </button>
            <button
              onClick={fetchData}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              {t.refresh}
            </button>
          </div>
        </div>

        {/* 4 Analytics Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.dailySale}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d9488', marginTop: '6px' }}>৳{metrics.daily.toLocaleString()}</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.monthlySale}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', marginTop: '6px' }}>৳{metrics.monthly.toLocaleString()}</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.cashCollection}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a', marginTop: '6px' }}>৳{metrics.cashCollected.toLocaleString()}</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{t.totalSale}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>৳{metrics.totalLifetime.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter Tabs (All, Pending, Approved, Delivered, Cancelled) & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { id: 'all', label: t.filterAll },
              { id: 'pending', label: t.filterPending },
              { id: 'approved', label: t.filterApproved },
              { id: 'delivered', label: t.filterDelivered },
              { id: 'cancelled', label: t.filterCancelled }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: activeFilter === tab.id ? '#0f172a' : '#fff',
                  color: activeFilter === tab.id ? '#fff' : '#334155',
                  fontWeight: activeFilter === tab.id ? '700' : '500',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
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
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', width: '100%', maxWidth: '280px' }}
          />
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>লোড হচ্ছে...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
            {t.noOrders}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filteredOrders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const isPaid = order.payment_status === 'paid';
              const isDelivered = order.status === 'delivered';

              return (
                <div key={order.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  
                  {/* Card Top */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0d9488' }}>#{order.order_number || String(order.id).slice(0, 8)}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString('bn-BD')}</span>
                          
                          {/* Payment Badge */}
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: isPaid ? '#dcfce7' : '#fee2e2',
                            color: isPaid ? '#15803d' : '#b91c1c'
                          }}>
                            {isPaid ? 'PAID' : 'UNPAID'} ({order.payment_method?.toUpperCase() || 'COD'})
                          </span>

                          {/* Status Badge */}
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: isDelivered ? '#e0e7ff' : order.status === 'approved' ? '#dcfce7' : order.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                            color: isDelivered ? '#4338ca' : order.status === 'approved' ? '#15803d' : order.status === 'cancelled' ? '#b91c1c' : '#b45309'
                          }}>
                            {order.status?.toUpperCase()}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#0f172a' }}>{order.shop_name || order.customer_name}</h3>
                        <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>📞 {order.phone}</div>
                      </div>

                      {/* Right Amount & Actions */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>৳{order.total_amount?.toLocaleString()}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', justifyContent: 'flex-end' }}>
                          <a href={`tel:${order.phone}`} style={{ textDecoration: 'none', padding: '5px 10px', borderRadius: '6px', background: '#f1f5f9', color: '#0f172a', fontSize: '12px', fontWeight: '600', border: '1px solid #cbd5e1' }}>
                            {t.call}
                          </a>
                          <a href={`https://wa.me/88${order.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '5px 10px', borderRadius: '6px', background: '#22c55e', color: '#fff', fontSize: '12px', fontWeight: '600' }}>
                            {t.whatsapp}
                          </a>
                          
                          {/* Edit Button (Locked if Delivered) */}
                          <button 
                            onClick={() => handleOpenEdit(order)} 
                            disabled={isDelivered}
                            title={isDelivered ? 'Delivered orders cannot be modified' : 'Edit order items'}
                            style={{ 
                              padding: '5px 10px', 
                              borderRadius: '6px', 
                              border: '1px solid #cbd5e1', 
                              background: isDelivered ? '#f1f5f9' : '#fff', 
                              color: isDelivered ? '#94a3b8' : '#0f172a',
                              fontSize: '12px', 
                              fontWeight: '600', 
                              cursor: isDelivered ? 'not-allowed' : 'pointer' 
                            }}
                          >
                            {isDelivered ? t.editLocked : t.edit}
                          </button>

                          <button onClick={() => handlePrintMemo(order)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            {t.print}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Payment & Status Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>পেমেন্ট:</span>
                      <button
                        onClick={() => updateOrderField(order.id, { payment_status: isPaid ? 'unpaid' : 'paid' })}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isPaid ? '1px solid #fca5a5' : '1px solid #86efac',
                          background: isPaid ? '#fef2f2' : '#f0fdf4',
                          color: isPaid ? '#991b1b' : '#166534',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isPaid ? t.markUnpaid : t.markPaid}
                      </button>

                      <div style={{ height: '14px', width: '1px', background: '#cbd5e1', margin: '0 6px' }} />

                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>অর্ডার স্ট্যাটাস:</span>
                      {['pending', 'approved', 'delivered', 'cancelled'].map((st) => (
                        <button
                          key={st}
                          onClick={() => updateOrderField(order.id, { status: st })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: order.status === st ? '#0f172a' : '#f8fafc',
                            color: order.status === st ? '#fff' : '#334155',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items Table with Live Calculated Stock */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>
                          <th style={{ padding: '10px 20px' }}>পণ্য</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>দর</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>পরিমাণ</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', background: '#f1f5f9' }}>{t.stockStatus}</th>
                          <th style={{ padding: '10px 20px', textAlign: 'right' }}>মোট</th>
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
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 20px', fontWeight: '600', color: '#0f172a' }}>{item.title}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#334155' }}>৳{item.unitPrice}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700' }}>{item.quantity} পিস</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', background: isShortStock ? '#fef2f2' : '#f8fafc' }}>
                                {isShortStock ? (
                                  <span style={{ color: '#b91c1c', fontWeight: '700', fontSize: '11px' }}>
                                    {t.stockOut} ({remainingStock} পিস)
                                  </span>
                                ) : (
                                  <span style={{ color: '#15803d', fontWeight: '600', fontSize: '11px' }}>
                                    ✓ {t.inStock} ({remainingStock} পিস অবশিষ্ট)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: '700' }}>৳{(item.unitPrice * item.quantity).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Order Edit Modal */}
        {editingOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>✏️ অর্ডার সম্পাদনা (Edit #{editingOrder.order_number})</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>দোকানের নাম:</label>
                <input
                  type="text"
                  value={editingOrder.shop_name || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, shop_name: e.target.value })}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />

                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>ফোন নম্বর:</label>
                <input
                  type="text"
                  value={editingOrder.phone || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>পেমেন্ট মাধ্যম:</label>
                    <select
                      value={editingOrder.payment_method || 'cod'}
                      onChange={(e) => setEditingOrder({ ...editingOrder, payment_method: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      <option value="cod">ক্যাশ অন ডেলিভারি</option>
                      <option value="bkash">বিকাশ</option>
                      <option value="nagad">নগদ</option>
                      <option value="bank">ব্যাংক ডিপোজিট</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>পেমেন্ট অবস্থা:</label>
                    <select
                      value={editingOrder.payment_status || 'unpaid'}
                      onChange={(e) => setEditingOrder({ ...editingOrder, payment_status: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      <option value="unpaid">বকেয়া (Unpaid)</option>
                      <option value="paid">পরিশোধিত (Paid)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Quantity Edit */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155' }}>আইটেম পরিমাণ (Quantity) পরিবর্তন:</h4>
                {(editingOrder.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#0f172a' }}>{item.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = Math.max(1, parseInt(e.target.value) || 1);
                          const updatedItems = [...editingOrder.items];
                          updatedItems[i] = { ...updatedItems[i], quantity: newQty };
                          setEditingOrder({ ...editingOrder, items: updatedItems });
                        }}
                        style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <span style={{ fontSize: '12px', color: '#64748b' }}>পিস</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setEditingOrder(null)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  {t.close}
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}