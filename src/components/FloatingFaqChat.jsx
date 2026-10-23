import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { SUPPORT } from '../lib/paymentConfig'
import { subscribeHelpDesk } from '../lib/helpDesk'
import { useOverlayHistory } from '../lib/useOverlayHistory'

/**
 * Live agent line. Digits only, with country code.
 * Falls back to the placeholder until SUPPORT.whatsapp is set.
 */
const WHATSAPP_NUMBER = SUPPORT.whatsapp || '8801XXXXXXXXX'

const FAQS = [
  {
    id: 'delivery',
    qBn: 'ডেলিভারি কত দিনে পাবো?',
    qEn: 'How long does delivery take?',
    aBn: 'ঢাকা সিটির মধ্যে ২৪-৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে শীর্ষ পরিবহন/কুরিয়ারে (AJR, Korotoa, Sundarban) ২-৩ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।',
    aEn: 'Inside Dhaka city, delivery is within 24–48 hours. Outside Dhaka, AJR, Korotoa, and Sundarban deliver in 2–3 working days.',
  },
  {
    id: 'order',
    qBn: 'কীভাবে পাইকারি অর্ডার করবো?',
    qEn: 'How do I place a wholesale order?',
    aBn: 'পণ্য সিলেক্ট করে কার্টে যোগ করুন। কার্ট থেকে সরাসরি আপনার ঠিকানা ও পছন্দের কুরিয়ার বেছে নিয়ে \'অর্ডার কনফার্ম\' বাটনে চাপলেই অর্ডার সম্পন্ন হয়ে যাবে।',
    aEn: 'Add products to the cart, choose your address and courier, then press Confirm order.',
  },
  {
    id: 'moq',
    qBn: 'সর্বনিম্ন কত পিস অর্ডার করা যায়?',
    qEn: 'What is the minimum order?',
    aBn: 'আমাদের প্রতিটি পণ্যের পাইকারি লট সাইজ আলাদা (সাধারণত সর্বনিম্ন ১০ থেকে ২৫ পিস)। বিস্তারিত জানতে পণ্যের বিবরণ দেখুন।',
    aEn: 'Each product has its own wholesale lot, usually 10 to 25 pieces. Check the product details for the exact lot.',
  },
  {
    id: 'pay',
    qBn: 'পেমেন্ট কীভাবে করতে হবে?',
    qEn: 'How do I pay?',
    aBn: 'আমরা কন্ডিশন/কুরিয়ার ক্যাশ-অন ডেলিভারি এবং অগ্রিম ব্যাংক/বিকাশ পেমেন্ট গ্রহণ করি।',
    aEn: 'We accept courier cash on delivery, and advance bank or bKash payment.',
  },
]

const GREETING = {
  bn: 'আসসালামু আলাইকুম! আপনাকে কীভাবে সাহায্য করতে পারি? নিচের যেকোনো বিষয়ে ট্যাপ করুন:',
  en: 'Assalamu alaikum! How can we help? Tap any topic below:',
}

const WA_TEXT = {
  bn: 'আসসালামু আলাইকুম! আমি Yousuf Wholesale থেকে পাইকারি অর্ডার নিয়ে কথা বলতে চাই।',
  en: 'Assalamu alaikum! I would like to talk about a wholesale order from Yousuf Wholesale.',
}

function TypingBubble() {
  return (
    <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-3" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="chat-dot h-1.5 w-1.5 rounded-full bg-slate-400"
          style={{ animationDelay: `${dot * 150}ms` }}
        />
      ))}
    </div>
  )
}

export function FloatingFaqChat() {
  const { lang, t } = useLanguage()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 300)
  const closeChat = useOverlayHistory(open, () => setOpen(false))
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState([])
  const idRef = useRef(0)
  const endRef = useRef(null)
  const closeRef = useRef(null)
  const timerRef = useRef(null)
  const bn = lang === 'bn'

  useEffect(() => subscribeHelpDesk(() => setOpen(true)), [])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    closeRef.current?.focus()
    function onKey(event) {
      if (event.key === 'Escape') closeChat()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeChat])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [open, messages, typing])

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/checkout')) return null
  if (!open && !scrolled) return null

  function ask(faq) {
    if (typing) return
    idRef.current += 1
    const questionId = `q-${idRef.current}`
    setMessages((current) => [
      ...current,
      { id: questionId, role: 'user', text: bn ? faq.qBn : faq.qEn },
    ])
    setTyping(true)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      idRef.current += 1
      setMessages((current) => [
        ...current,
        { id: `a-${idRef.current}`, role: 'bot', text: bn ? faq.aBn : faq.aEn },
      ])
      setTyping(false)
    }, 650)
  }

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(bn ? WA_TEXT.bn : WA_TEXT.en)}`

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <section
          role="dialog"
          aria-label={bn ? 'Yousuf Wholesale হেল্প ডেস্ক' : 'Yousuf Wholesale help desk'}
          className="flex max-h-[min(26rem,calc(100dvh-26rem))] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl md:max-h-[min(32rem,calc(100dvh-8rem))]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-ink px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">Yousuf Wholesale হেল্প ডেস্ক</p>
                <p className="text-[11px] font-semibold text-emerald-300">{bn ? 'অনলাইন' : 'Online'}</p>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={closeChat}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white hover:bg-white/10"
              aria-label={t.close}
            >
              ✕
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
            <div className="mr-auto max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-sm leading-relaxed text-ink">
              {bn ? GREETING.bn : GREETING.en}
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto rounded-br-md bg-ink text-white'
                    : 'mr-auto rounded-bl-md bg-slate-100 text-ink'
                }`}
              >
                {message.text}
              </div>
            ))}
            {typing && <TypingBubble />}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 px-3 pt-2">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
              {FAQS.map((faq) => (
                <button
                  key={faq.id}
                  type="button"
                  disabled={typing}
                  onClick={() => ask(faq)}
                  className="inline-flex h-11 shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-ink transition-all duration-200 hover:border-ink hover:bg-white disabled:opacity-60"
                >
                  {bn ? faq.qBn : faq.qEn}
                </button>
              ))}
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="mb-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-center text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {bn ? 'সরাসরি এজেন্টের সাথে কথা বলুন (WhatsApp)' : 'Talk to an agent (WhatsApp)'}
            </a>
          </div>
        </section>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-200 sm:h-14 sm:w-auto sm:gap-2 sm:bg-ink sm:pl-3 sm:pr-4 sm:text-sm sm:font-bold sm:hover:bg-navy"
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-label={bn ? 'প্রশ্ন আছে?' : 'Need help?'}
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5 sm:right-3 sm:top-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="hidden sm:inline">{bn ? 'প্রশ্ন আছে?' : 'Need help?'}</span>
        </button>
      )}
    </div>
  )
}
