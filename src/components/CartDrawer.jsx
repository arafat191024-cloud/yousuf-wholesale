import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';

export function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
  const { lang } = useLanguage();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerShop, setCustomerShop] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'bkash', 'nagad', 'bank'
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  if (!isCartOpen) return null;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!customerPhone.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বরটি লিখুন!' : 'Please enter your mobile number!');
      return;
    }

    setSubmitting(true);

    try {
      const generatedOrderNumber = 'YE-' + Math.floor(100000 + Math.random() * 900000);

      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            order_number: generatedOrderNumber,
            customer_name: customerName.trim() || (lang === 'bn' ? 'পাইকারি ক্রেতা' : 'Wholesale Client'),
            phone: customerPhone.trim(),
            shop_name: customerShop.trim() || customerAddress.trim() || 'Not specified',
            total_amount: totalAmount,
            status: 'pending',
            payment_method: paymentMethod,
            payment_status: 'unpaid',
            items: cartItems
          }
        ])
        .select()
        .single();

      if (error) {
        alert('সমস্যা হয়েছে: ' + error.message);
        return;
      }

      setOrderSuccess(data?.order_number || generatedOrderNumber);
      clearCart();
    } catch (err) {
      console.error(err);
      alert('অর্ডার প্রক্রিয়ায় সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setOrderSuccess(null);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#ffffff',
        height: '100%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 25px rgba(0,0,0,0.2)',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
            {lang === 'bn' ? 'পাইকারি অর্ডার কার্ট' : 'Wholesale Cart'}
          </h2>
          <button
            onClick={handleClose}
            style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {orderSuccess ? (
          <div style={{ textAlign: 'center', margin: 'auto 0', padding: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px auto'
            }}>
              ✓
            </div>
            <h3 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '20px' }}>
              {lang === 'bn' ? 'অর্ডার গ্রহণ করা হয়েছে!' : 'Order Placed Successfully!'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {lang === 'bn' 
                ? 'ধন্যবাদ! ইউসুফ এন্টারপ্রাইজ থেকে খুব শীঘ্রই আপনার মোবাইলে কল দিয়ে অর্ডার কনফার্ম করা হবে।'
                : 'Thank you! Yousuf Enterprise will call your mobile shortly to confirm the order.'}
            </p>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '14px', color: '#334155', marginBottom: '24px' }}>
              ট্র্যাকিং নম্বর: <strong>#{orderSuccess}</strong>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'Got it'}
            </button>
          </div>
        ) : (
          <>
            {/* Item List */}
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
              {cartItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', marginTop: '60px' }}>
                  {lang === 'bn' ? 'কার্টটি খালি রয়েছে' : 'Your cart is empty'}
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <div style={{ maxWidth: '60%' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#0f172a' }}>{item.title}</h4>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>৳{item.unitPrice} / পিস</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.key, parseInt(e.target.value) || 1)}
                        style={{ width: '55px', padding: '6px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                      />
                      <button
                        onClick={() => removeFromCart(item.key)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Form */}
            {cartItems.length > 0 && (
              <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'দোকানের নাম / মার্কেট' : 'Shop / Market Name'}
                    value={customerShop}
                    onChange={(e) => setCustomerShop(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your Name'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <input
                    type="tel"
                    placeholder={lang === 'bn' ? 'মোবাইল নম্বর (আবশ্যক)*' : 'Mobile Number (Required)*'}
                    value={customerPhone}
                    required
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'ঠিকানা / জেলা' : 'Delivery Address / District'}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                  />

                  {/* Payment Method Selection */}
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'পেমেন্ট পদ্ধতি বেছে নিন:' : 'Payment Method:'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="cod">{lang === 'bn' ? '💵 ক্যাশ অন ডেলিভারি (Cash on Delivery)' : '💵 Cash on Delivery'}</option>
                    <option value="bkash">{lang === 'bn' ? '📱 বিকাশ পেমেন্ট (bKash)' : '📱 bKash'}</option>
                    <option value="nagad">{lang === 'bn' ? '📱 নগদ পেমেন্ট (Nagad)' : '📱 Nagad'}</option>
                    <option value="bank">{lang === 'bn' ? '🏦 ব্যাংক ডিপোজিট (Bank Transfer)' : '🏦 Bank Transfer'}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{lang === 'bn' ? 'মোট বিল:' : 'Total:'}</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>৳{totalAmount}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: submitting ? '#94a3b8' : '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    marginBottom: '6px'
                  }}
                >
                  {submitting ? (lang === 'bn' ? 'অর্ডার জমা হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? '✓ সরাসরি অর্ডার কনফার্ম করুন' : '✓ Confirm Wholesale Order')}
                </button>

                <button
                  onClick={clearCart}
                  style={{ width: '100%', padding: '4px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}
                >
                  {lang === 'bn' ? 'কার্ট খালি করুন' : 'Clear Cart'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}