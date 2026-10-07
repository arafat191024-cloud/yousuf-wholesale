import { formatTaka } from '../lib/format'

const copy = {
  bn: {
    today: 'আজ',
    week: 'এই সপ্তাহ',
    month: 'এই মাস',
    all: 'সব সময়',
    cash: 'নগদ আদায়',
    bkash: 'বিকাশ আদায়',
    bank: 'ব্যাংক আদায়',
    due: 'বাকি / অনাদায়',
    net: 'প্রকৃত আদায়',
    netHint: 'নগদ + বিকাশ + ব্যাংক',
    orders: 'টি',
  },
  en: {
    today: 'Today',
    week: 'This week',
    month: 'This month',
    all: 'All time',
    cash: 'Cash collected',
    bkash: 'bKash collected',
    bank: 'Bank collected',
    due: 'Due / unpaid',
    net: 'Realized revenue',
    netHint: 'Cash + bKash + bank',
    orders: 'orders',
  },
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14h3" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10h16M6 10v7M10 10v7M14 10v7M18 10v7M3 19h18M12 4l9 5H3l9-5Z" />
    </svg>
  )
}

function DueIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  )
}

const CARDS = [
  { key: 'cash', icon: WalletIcon, shell: 'border-emerald-200 bg-emerald-50 text-emerald-800', amount: 'text-emerald-950' },
  { key: 'bkash', icon: PhoneIcon, shell: 'border-pink-200 bg-pink-50 text-pink-800', amount: 'text-pink-950' },
  { key: 'bank', icon: BankIcon, shell: 'border-indigo-200 bg-indigo-50 text-indigo-900', amount: 'text-indigo-950' },
  { key: 'due', icon: DueIcon, shell: 'border-amber-200 bg-amber-50 text-amber-900', amount: 'text-rose-700' },
]

export function PaymentBreakdown({ lang, range, onRange, stats }) {
  const t = copy[lang] || copy.bn
  const ranges = [
    ['today', t.today],
    ['week', t.week],
    ['month', t.month],
    ['all', t.all],
  ]

  return (
    <section className="mb-5">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {ranges.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onRange(id)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-bold transition-all duration-200 ${
              range === id ? 'bg-ink text-white' : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {CARDS.map((card) => {
          const bucket = stats[card.key] || { amount: 0, count: 0 }
          const Icon = card.icon
          return (
            <article
              key={card.key}
              className={`rounded-3xl border p-4 shadow-sm transition-all duration-200 ${card.shell}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80">
                  <Icon />
                </span>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-extrabold">
                  {bucket.count} {t.orders}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold">{t[card.key]}</p>
              <p className={`mt-1 text-xl font-extrabold tracking-tight sm:text-2xl ${card.amount}`}>
                {formatTaka(bucket.amount, lang)}
              </p>
            </article>
          )
        })}
      </div>
      <article className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-slate-500">{t.net}</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{formatTaka(stats.net.amount, lang)}</p>
          </div>
          <p className="text-xs font-semibold text-slate-500">{t.netHint}</p>
        </div>
      </article>
    </section>
  )
}
