import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { EmptyState } from './EmptyState';
import {
  PAYMENT_ACCOUNTS,
  needsTransactionId,
  paymentMethodLabel,
} from '../lib/paymentConfig';

const METHODS = [
  { id: 'cod', icon: '💵' },
  { id: 'bkash', icon: '📱' },
  { id: 'bank', icon: '🏦' },
];

export function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
  const { lang, t } = useLanguage();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerShop, setCustomerShop] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    document.body.style.overflow = isCartOpen && !isAdmin ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isAdmin]);

  const showPrepaid = needsTransactionId(paymentMethod);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!customerPhone.trim()) {
      toast.error(t.phoneMissing);
      return;
    }

    if (showPrepaid && !transactionId.trim()) {
      toast.error(t.trxMissing);
      return;
    }

    setSubmitting(true);

    try {
      const generatedOrderNumber = 'YE-' + Math.floor(100000 + Math.random() * 900000);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const payload = {
        order_number: generatedOrderNumber,
        customer_name: customerName.trim() || (lang === 'bn' ? 'পাইকারি ক্রেতা' : 'Wholesale Client'),
        phone: customerPhone.trim(),
        shop_name: customerShop.trim() || customerAddress.trim() || 'Not specified',
        delivery_address: customerAddress.trim() || null,
        subtotal: totalAmount,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        transaction_id: showPrepaid ? transactionId.trim() : null,
        payment_reference: paymentReference.trim() || null,
        items: cartItems,
      };

      if (userId) payload.user_id = userId;

      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast.error(error.message || t.orderError);
        return;
      }

      const orderNumber = data?.order_number || generatedOrderNumber;
      localStorage.setItem('last_order_phone', customerPhone.trim());
      const recent = JSON.parse(localStorage.getItem('recent_orders') || '[]');
      recent.unshift({
        order_number: orderNumber,
        phone: customerPhone.trim(),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        transaction_id: showPrepaid ? transactionId.trim() : null,
        payment_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
        items: cartItems,
      });
      localStorage.setItem('recent_orders', JSON.stringify(recent.slice(0, 8)));

      setOrderSuccess(orderNumber);
      toast.success(t.orderSuccess);
      clearCart();
      setTransactionId('');
      setPaymentReference('');
    } catch (err) {
      console.error(err);
      toast.error(t.orderError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setOrderSuccess(null);
  };

  const fieldClass =
    'h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-ink';

  if (isAdmin) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] transition-all duration-200 ${
        isCartOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isCartOpen}
    >
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-ink/50"
        onClick={handleClose}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-all duration-200 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-extrabold text-ink">{t.cartTitle}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-stone-500 transition-all duration-200 hover:bg-sand"
          >
            ✕
          </button>
        </div>

        {orderSuccess ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-ink">{t.orderSuccess}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{t.orderSuccessBody}</p>
            <div className="mt-4 w-full rounded-2xl bg-sand px-4 py-3 text-sm text-stone-700">
              {t.tracking}: <strong>#{orderSuccess}</strong>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200"
            >
              {t.gotIt}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <EmptyState icon="🛒" title={t.cartEmpty} body={t.cartEmptyBody} />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {cartItems.map((item) => (
                    <li key={item.key} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-ink">{item.title}</h4>
                        <p className="text-xs text-stone-500">৳{item.unitPrice} {t.perPiece}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 text-lg transition-all duration-200 hover:bg-sand"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          aria-label="-"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 text-lg transition-all duration-200 hover:bg-sand"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          aria-label="+"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-500 transition-all duration-200 hover:bg-red-50"
                          onClick={() => removeFromCart(item.key)}
                          aria-label="remove"
                        >
                          🗑
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-stone-100 px-5 py-4">
                <div className="grid gap-2">
                  <input className={fieldClass} placeholder={t.shopNameField} value={customerShop} onChange={(e) => setCustomerShop(e.target.value)} />
                  <input className={fieldClass} placeholder={t.yourName} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <input className={fieldClass} type="tel" required placeholder={t.phoneRequired} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  <input className={fieldClass} placeholder={t.address} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
                </div>

                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-stone-500">{t.paymentMethod}</p>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((method) => {
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`min-h-11 rounded-xl border px-2 py-2 text-center text-xs font-bold transition-all duration-200 ${
                          active ? 'border-ink bg-ink text-white' : 'border-stone-200 bg-white text-ink hover:border-stone-300'
                        }`}
                      >
                        <span className="block text-base">{method.icon}</span>
                        {paymentMethodLabel(method.id, lang)}
                      </button>
                    );
                  })}
                </div>

                {showPrepaid && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-stone-700">
                    {paymentMethod === 'bank' ? (
                      <div className="space-y-1">
                        <p className="font-bold text-ink">{t.bank}</p>
                        <p>{t.accountName}: {PAYMENT_ACCOUNTS.bank.accountName}</p>
                        <p>{PAYMENT_ACCOUNTS.bank.branch}</p>
                        {PAYMENT_ACCOUNTS.bank.accountNumber ? (
                          <p className="font-mono font-bold">{PAYMENT_ACCOUNTS.bank.accountNumber}</p>
                        ) : (
                          <p>{t.bankHint} <strong>{PAYMENT_ACCOUNTS.bank.confirmPhone}</strong></p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-ink">{t.bkashSendTo}</p>
                        <p className="font-mono text-base font-extrabold text-ink">{PAYMENT_ACCOUNTS.bkash.number}</p>
                        <p>{PAYMENT_ACCOUNTS.bkash.name} · {PAYMENT_ACCOUNTS.bkash.type}</p>
                        <p>{t.sendMoney}</p>
                      </div>
                    )}
                    <label className="mt-3 block text-xs font-bold text-stone-600">{t.trxId}</label>
                    <input
                      className={`${fieldClass} mt-1`}
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder={t.trxPlaceholder}
                      required
                    />
                    <label className="mt-2 block text-xs font-bold text-stone-600">{t.receiptRef}</label>
                    <input
                      className={`${fieldClass} mt-1`}
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={t.receiptPlaceholder}
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{t.total}</span>
                  <span className="text-xl font-extrabold text-ink">৳{totalAmount.toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-3 h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {submitting ? t.submitting : t.confirmOrder}
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-1 h-11 w-full text-xs font-semibold text-stone-500 transition-all duration-200"
                >
                  {t.clearCart}
                </button>
              </div>
            )}
          </form>
        )}
      </aside>
    </div>
  );
}
