import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { EmptyState } from '../components/EmptyState'
import { isPaymentFailed, isPaymentVerified, paymentMethodLabel } from '../lib/paymentConfig'

function statusLabel(status, lang) {
  const map = {
    pending: { bn: 'অপেক্ষমাণ', en: 'Pending' },
    approved: { bn: 'অনুমোদিত', en: 'Approved' },
    confirmed: { bn: 'কনফার্মড', en: 'Confirmed' },
    processing: { bn: 'প্রসেসিং', en: 'Processing' },
    shipped: { bn: 'শিপড', en: 'Shipped' },
    delivered: { bn: 'ডেলিভার্ড', en: 'Delivered' },
    cancelled: { bn: 'বাতিল', en: 'Cancelled' },
  }
  return map[status]?.[lang] || status || '—'
}

function OrderCard({ order, lang, t }) {
  const items = Array.isArray(order.items) ? order.items : []
  const verified = isPaymentVerified(order.payment_status)
  const failed = isPaymentFailed(order.payment_status)
  const payLabel = verified ? t.paymentVerified : failed ? t.paymentFailed : t.paymentPending
  const payClass = verified
    ? 'bg-emerald-100 text-emerald-800'
    : failed
      ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-800'
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-brass">#{order.order_number || String(order.id || '').slice(0, 8)}</p>
          <p className="mt-1 text-xs text-stone-500">
            {order.created_at ? new Date(order.created_at).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB') : ''}
          </p>
        </div>
        <p className="text-lg font-extrabold text-ink">৳{Number(order.total_amount || 0).toLocaleString()}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-700">
          {statusLabel(order.status, lang)}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${payClass}`}>
          {paymentMethodLabel(order.payment_method, lang)} · {payLabel}
        </span>
      </div>
      {order.transaction_id && (
        <p className="mt-3 rounded-xl bg-sand px-3 py-2 font-mono text-xs font-bold text-ink">
          TrxID: {order.transaction_id}
        </p>
      )}
      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-stone-100 text-sm">
          {items.map((item, idx) => (
            <li key={item.key || idx} className="flex justify-between gap-3 py-2">
              <span className="text-stone-700">{item.title}</span>
              <span className="shrink-0 font-semibold">{item.quantity} × ৳{item.unitPrice}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function Orders() {
  const { user, loading: authLoading } = useAuth()
  const { lang, t } = useLanguage()
  const [phone, setPhone] = useState(() => localStorage.getItem('last_order_phone') || '')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [notice, setNotice] = useState('')

  async function loadOrders(nextPhone = phone) {
    setLoading(true)
    setNotice('')
    const localRecent = JSON.parse(localStorage.getItem('recent_orders') || '[]')

    if (user?.id) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setOrders(data)
        setSearched(true)
        setLoading(false)
        return
      }
    }

    const trimmed = nextPhone.trim()
    if (!trimmed) {
      setOrders(localRecent)
      setSearched(true)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('phone', trimmed)
      .order('created_at', { ascending: false })

    if (error || !data) {
      const matched = localRecent.filter((order) => order.phone === trimmed)
      setOrders(matched)
      setNotice(matched.length ? '' : t.noMatchOrders)
    } else if (data.length === 0) {
      const matched = localRecent.filter((order) => order.phone === trimmed)
      setOrders(matched)
      if (!matched.length) setNotice(t.noMatchOrders)
    } else {
      setOrders(data)
    }
    setSearched(true)
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (user) loadOrders()
    else {
      const recent = JSON.parse(localStorage.getItem('recent_orders') || '[]')
      setOrders(recent)
      setSearched(recent.length > 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-ink">{t.ordersTitle}</h1>
      <p className="mt-2 text-sm text-stone-500">{t.ordersGuest}</p>

      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          localStorage.setItem('last_order_phone', phone.trim())
          loadOrders(phone)
        }}
      >
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.phoneRequired}
          className="h-11 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-ink"
        />
        <button type="submit" className="h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white transition-all duration-200">
          {t.findOrders}
        </button>
      </form>

      {!user && (
        <Link to="/login" className="mt-3 inline-flex h-11 items-center text-sm font-bold text-brass">
          {t.login} →
        </Link>
      )}

      <div className="mt-6 space-y-4">
        {loading || authLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-stone-200/80" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={searched && notice ? t.noMatchOrders : t.ordersEmpty}
            body={t.ordersEmptyBody}
            action={
              <Link to="/" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white">
                {t.browse}
              </Link>
            }
          />
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id || order.order_number} order={order} lang={lang} t={t} />
          ))
        )}
      </div>
    </div>
  )
}
