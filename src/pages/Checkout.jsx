import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { BackButton } from '../components/BackButton'
import { CartLines } from '../components/CartLines'
import { EmptyState } from '../components/EmptyState'
import { formatTaka } from '../lib/format'
import {
  PAYMENT_ACCOUNTS,
  accountDisplayName,
  needsTransactionId,
  paymentMethodLabel,
} from '../lib/paymentConfig'

const METHODS = [
  { id: 'cod', icon: '💵' },
  { id: 'bkash', icon: '📱' },
  { id: 'bank', icon: '🏦' },
]

function readDraft(key, fallback = '') {
  return sessionStorage.getItem(key) || fallback
}

export function Checkout() {
  const { cartItems, totalAmount, clearCart } = useCart()
  const { lang, t } = useLanguage()
  const { profile } = useAuth()

  const [customerName, setCustomerName] = useState(() => readDraft('ck_name'))
  const [customerPhone, setCustomerPhone] = useState(() => readDraft('ck_phone', localStorage.getItem('last_order_phone') || ''))
  const [customerShop, setCustomerShop] = useState(() => readDraft('ck_shop'))
  const [customerAddress, setCustomerAddress] = useState(() => readDraft('ck_address'))
  const [paymentMethod, setPaymentMethod] = useState(() => readDraft('ck_method', 'cod'))
  const [transactionId, setTransactionId] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)

  useEffect(() => {
    sessionStorage.setItem('ck_name', customerName)
    sessionStorage.setItem('ck_phone', customerPhone)
    sessionStorage.setItem('ck_shop', customerShop)
    sessionStorage.setItem('ck_address', customerAddress)
    sessionStorage.setItem('ck_method', paymentMethod)
  }, [customerName, customerPhone, customerShop, customerAddress, paymentMethod])

  useEffect(() => {
    if (profile?.name) setCustomerName((value) => value || profile.name)
    if (profile?.phone) setCustomerPhone((value) => value || profile.phone)
    if (profile?.address) setCustomerAddress((value) => value || profile.address)
  }, [profile])

  const showPrepaid = needsTransactionId(paymentMethod)
  const fieldClass = 'h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-sm outline-none transition-all duration-200 ease-out focus:border-ink focus:shadow-sm'

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t.copied)
    } catch {
      toast.error(t.copyFailed)
    }
  }

  async function handleCheckout(e) {
    e.preventDefault()
    if (cartItems.length === 0) return

    if (!customerPhone.trim()) {
      toast.error(t.phoneMissing)
      return
    }
    if (showPrepaid && !transactionId.trim()) {
      toast.error(t.trxMissing)
      return
    }
    if (showPrepaid && !senderNumber.trim()) {
      toast.error(t.senderMissing)
      return
    }

    setSubmitting(true)
    try {
      const generatedOrderNumber = 'YE-' + Math.floor(100000 + Math.random() * 900000)
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null

      const payload = {
        order_number: generatedOrderNumber,
        customer_name: customerName.trim() || (lang === 'bn' ? 'পাইকারি ক্রেতা' : 'Wholesale client'),
        phone: customerPhone.trim(),
        shop_name: customerShop.trim() || customerAddress.trim() || (lang === 'bn' ? 'উল্লেখ নেই' : 'Not specified'),
        delivery_address: customerAddress.trim() || null,
        subtotal: totalAmount,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        transaction_id: showPrepaid ? transactionId.trim() : null,
        sender_number: showPrepaid ? senderNumber.trim() : null,
        payment_reference: paymentReference.trim() || null,
        items: cartItems,
      }
      if (userId) payload.user_id = userId

      let { data, error } = await supabase.from('orders').insert([payload]).select().single()
      if (error && /sender_number/i.test(error.message || '')) {
        const { sender_number: sentFrom, ...rest } = payload
        rest.payment_reference = [sentFrom, rest.payment_reference].filter(Boolean).join(' · ') || null
        const retry = await supabase.from('orders').insert([rest]).select().single()
        data = retry.data
        error = retry.error
      }
      if (error) {
        toast.error(t.orderError)
        console.error(error)
        return
      }

      const orderNumber = data?.order_number || generatedOrderNumber
      localStorage.setItem('last_order_phone', customerPhone.trim())
      const recent = JSON.parse(localStorage.getItem('recent_orders') || '[]')
      recent.unshift({
        order_number: orderNumber,
        phone: customerPhone.trim(),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        transaction_id: showPrepaid ? transactionId.trim() : null,
        sender_number: showPrepaid ? senderNumber.trim() : null,
        payment_status: 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
        items: cartItems,
      })
      localStorage.setItem('recent_orders', JSON.stringify(recent.slice(0, 8)))
      setOrderSuccess(orderNumber)
      toast.success(t.orderSuccess)
      clearCart()
      setTransactionId('')
      setSenderNumber('')
      setPaymentReference('')
    } catch (err) {
      console.error(err)
      toast.error(t.orderError)
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="premium-card rounded-3xl px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
          <h1 className="text-2xl font-extrabold text-ink">{t.orderSuccess}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t.orderSuccessBody}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {t.tracking}: <strong>#{orderSuccess}</strong>
          </div>
          <Link to="/" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200 ease-out hover:bg-navy">
            {t.gotIt}
          </Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <BackButton fallback="/" />
        <div className="mt-4">
          <EmptyState
            icon="🛒"
            title={t.cartEmpty}
            body={t.cartEmptyBody}
            action={
              <Link to="/" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white">
                {t.browse}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const bank = PAYMENT_ACCOUNTS.bank
  const bkash = PAYMENT_ACCOUNTS.bkash

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <BackButton fallback="/" />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{t.checkoutTitle}</h1>

      <form onSubmit={handleCheckout} className="mt-5 grid gap-4">
        <section className="premium-card rounded-3xl p-4">
          <h2 className="text-sm font-extrabold text-ink">{t.reviewSection}</h2>
          <CartLines />
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-semibold">{t.total}</span>
            <span className="text-xl font-extrabold">{formatTaka(totalAmount, lang)}</span>
          </div>
        </section>

        <section className="premium-card rounded-3xl p-4">
          <h2 className="text-sm font-extrabold text-ink">{t.contactSection}</h2>
          <div className="mt-3 grid gap-2">
            <input className={fieldClass} placeholder={t.shopNameField} value={customerShop} onChange={(e) => setCustomerShop(e.target.value)} />
            <input className={fieldClass} placeholder={t.yourName} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <input className={fieldClass} type="tel" required placeholder={t.phoneRequired} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            <input className={fieldClass} placeholder={t.address} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
          </div>
        </section>

        <section className="premium-card rounded-3xl p-4">
          <h2 className="text-sm font-extrabold text-ink">{t.paymentMethod}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {METHODS.map((method) => {
              const active = paymentMethod === method.id
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`min-h-11 rounded-xl border px-2 py-2 text-center text-xs font-bold transition-all duration-200 ease-out ${
                    active ? 'border-ink bg-ink text-white shadow-sm' : 'border-slate-200/80 bg-white text-ink hover:shadow-md'
                  }`}
                >
                  <span className="block text-base">{method.icon}</span>
                  {paymentMethodLabel(method.id, lang)}
                </button>
              )
            })}
          </div>

          {!showPrepaid && <p className="mt-3 text-sm text-slate-500">{t.codHint}</p>}

          {showPrepaid && (
            <div className="mt-3 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-3 text-sm text-slate-700">
              {paymentMethod === 'bank' ? (
                <div className="space-y-1">
                  <p className="font-bold text-ink">{t.bank}</p>
                  <p>{t.accountName}: {accountDisplayName(bank, lang)}</p>
                  <p>{t.branch}: {lang === 'bn' ? bank.branchBn : bank.branch}</p>
                  {bank.accountNumber ? (
                    <p className="font-mono text-base font-extrabold text-ink">{bank.accountNumber}</p>
                  ) : (
                    <p>{t.bankHint} <strong>{bank.confirmPhone}</strong></p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-ink">{t.bkashSendTo}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-base font-extrabold text-ink">{bkash.number}</p>
                    <button type="button" onClick={() => copyText(bkash.number)} className="inline-flex h-11 items-center rounded-xl bg-ink px-3 text-xs font-bold text-white">
                      {t.copy}
                    </button>
                  </div>
                  <p>{accountDisplayName(bkash, lang)} · {t.personal}</p>
                  <p>{t.sendMoney}</p>
                </div>
              )}

              <label className="mt-3 block text-xs font-bold text-slate-600">{t.trxId}</label>
              <input className={`${fieldClass} mt-1 font-mono`} value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder={t.trxPlaceholder} required />
              <label className="mt-2 block text-xs font-bold text-slate-600">{t.senderNumber}</label>
              <input className={`${fieldClass} mt-1`} type="tel" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder={t.senderPlaceholder} required />
              <label className="mt-2 block text-xs font-bold text-slate-600">{t.receiptRef}</label>
              <input className={`${fieldClass} mt-1`} value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder={t.receiptPlaceholder} />
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-2xl bg-brass text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:bg-brass-deep hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? t.submitting : t.confirmOrder}
        </button>
      </form>
    </div>
  )
}
