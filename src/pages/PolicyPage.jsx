import { BackButton } from '../components/BackButton'
import { useLanguage } from '../context/LanguageContext'

const POLICIES = {
  terms: {
    bn: {
      title: 'হোলসেল টার্মস',
      paragraphs: [
        'Yousuf Wholesale পাইকারি দোকান, ফার্নিচার কারখানা ও ঠিকাদারদের জন্য কাস্টার হুইল, হ্যান্ডেল লক ও ক্যাবিনেট ফিটিংস সরবরাহ করে। ওয়েবসাইটের দাম পাইকারি রেট।',
        'প্রতিটি পণ্যের লট সাইজ আলাদা, সাধারণত সর্বনিম্ন ১০ থেকে ২৫ পিস। অর্ডার কনফার্মের আগে স্টক ও দাম ফোনে নিশ্চিত করা হয়।',
        'ঢাকা সিটিতে ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে AJR, Korotoa, Sundarban সহ তালিকাভুক্ত পরিবহনে ২-৩ কার্যদিবস লাগতে পারে। পরিবহন খরচ চ্যানেল ও ওজন অনুসারে ক্রেতা বহন করেন, যদি না আলাদা করে লেখা থাকে।',
        'পেমেন্ট: কুরিয়ার ক্যাশ-অন ডেলিভারি, অথবা অগ্রিম বিকাশ / ব্যাংক ট্রান্সফার। অগ্রিম পেমেন্টে লেনদেন নম্বর ও প্রেরকের নম্বর দিতে হয়।',
      ],
    },
    en: {
      title: 'Wholesale terms',
      paragraphs: [
        'Yousuf Wholesale supplies caster wheels, handle locks, and cabinet fittings to shops, furniture factories, and contractors. Prices on this site are wholesale rates.',
        'Lot size varies by product, usually a minimum of 10 to 25 pieces. Stock and price are confirmed by phone before an order is finalized.',
        'Dhaka city delivery is 24–48 hours. Outside Dhaka, listed carriers including AJR, Korotoa, and Sundarban take 2–3 working days. Freight follows the carrier and weight unless stated otherwise.',
        'Payment is courier cash on delivery, or advance bKash / bank transfer. Advance payments need a transaction ID and the sender number.',
      ],
    },
  },
  returns: {
    bn: {
      title: 'রিটার্ন ও রিফান্ড নীতি',
      paragraphs: [
        'কারখানার ত্রুটি বা ভুল পণ্য ডেলিভারির ৩ কার্যদিবসের মধ্যে WhatsApp সাপোর্টে জানালে বদল বা সমন্বয় করা হয়। ছবি ও অর্ডার নম্বর সাথে দিন।',
        'খোলা, কাটা, লাগানো বা ব্যবহৃত পণ্য ফেরত নেওয়া হয় না। পাইকারি লটের আংশিক খোলা কার্টন আলাদা চুক্তি ছাড়া ফেরত হয় না।',
        'কুরিয়ার ভাঙনের দাবি পার্সেল খোলার সময় নোট করিয়ে সাপোর্টে জানাতে হয়। অনুমোদিত রিফান্ড মূল পেমেন্ট মাধ্যমে সমন্বয় করা হয়।',
      ],
    },
    en: {
      title: 'Return and refund policy',
      paragraphs: [
        'Factory defects or the wrong item are exchanged or adjusted when reported to WhatsApp support within 3 working days of delivery. Include photos and the order number.',
        'Opened, cut, installed, or used goods are not returnable. A partly opened wholesale carton is not returned unless agreed separately.',
        'Courier damage must be noted when the parcel is opened and sent to support. Approved refunds are settled through the original payment method.',
      ],
    },
  },
}

export function PolicyPage({ kind }) {
  const { lang } = useLanguage()
  const page = POLICIES[kind] || POLICIES.terms
  const copy = page[lang] || page.bn

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-36 md:pb-10">
      <BackButton fallback="/" />
      <article className="premium-card mt-4 rounded-3xl p-5 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brass">Yousuf Wholesale</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{copy.title}</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
          {copy.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  )
}
