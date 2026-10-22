import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BadgeCheck, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { useCatalog } from '../lib/useCatalog'
import { SUPPORT } from '../lib/paymentConfig'
import { FOOTER_CATEGORIES, categoryHref } from '../lib/storeNav'
import { openHelpDesk } from '../lib/helpDesk'

/** Edit this if the Facebook page URL changes. */
const FACEBOOK_URL = 'https://facebook.com/yousufwholesale'

const LOGISTICS = [
  { bn: 'এ জে আর পার্সেল', en: 'AJR Parcel' },
  { bn: 'সুন্দরবন কুরিয়ার', en: 'Sundarban Courier' },
  { bn: 'করতোয়া কুরিয়ার', en: 'Korotoa Courier' },
  { bn: 'এস এ পরিবহন', en: 'SA Paribahan' },
  { bn: 'জননী এক্সপ্রেস', en: 'Janani Express' },
  { bn: 'বিসমিল্লাহ কুরিয়ার', en: 'Bismillah Courier' },
  { bn: 'রয়েল কুরিয়ার', en: 'Royel Courier' },
  { bn: 'ফাইভ স্টার ট্রান্সপোর্ট', en: '5 Star Transport' },
  { bn: 'সেভেন স্টার ট্রান্সপোর্ট', en: '7 Star Transport' },
  { bn: 'সবুজ বাংলা কুরিয়ার', en: 'Sobuj Bangla' },
]

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function prettyPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 11) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return value
}

function footerPad(pathname, count) {
  if (pathname === '/checkout') return 'pb-8 md:pb-10'
  const onCategory = pathname.startsWith('/category')
  const hasCart = count > 0 && pathname !== '/checkout'
  if (onCategory && hasCart) return 'pb-[calc(16rem+env(safe-area-inset-bottom))] md:pb-10'
  if (onCategory || hasCart) return 'pb-[calc(12rem+env(safe-area-inset-bottom))] md:pb-10'
  return 'pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-10'
}

const linkClass = 'text-sm leading-6 text-slate-300 transition-colors duration-200 hover:text-white'
const headingClass = 'text-xs font-extrabold uppercase tracking-[0.14em] text-amber-200'

export function Footer() {
  const { lang } = useLanguage()
  const { categories } = useCatalog()
  const { totalCount } = useCart()
  const location = useLocation()
  const bn = lang === 'bn'
  const year = new Date().getFullYear()
  const whatsapp = `https://wa.me/${SUPPORT.whatsapp}`

  useEffect(() => {
    if (location.hash !== '#contact') return
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, location.pathname])

  return (
    <footer id="contact" className={`scroll-mt-48 bg-ink text-white ${footerPad(location.pathname, totalCount)}`}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
            {bn ? 'সরাসরি আমদানিকারক' : 'Direct importer'}
          </p>
          <p className="mt-2 text-xl font-extrabold tracking-tight">Yousuf Wholesale</p>
          <p className="mt-1 text-sm font-semibold text-slate-300">{bn ? 'ইউসুফ হোলসেল' : 'Yousuf Enterprise'}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {bn
              ? 'ঢাকার হার্ডওয়্যার বাজার থেকে কাস্টার হুইল, হ্যান্ডেল লক ও ক্যাবিনেট ফিটিংস পাইকারি সরবরাহ। দোকান, ফার্নিচার কারখানা ও ঠিকাদারদের জন্য গুদাম থেকে সারা বাংলাদেশে ডেলিভারি।'
              : 'Wholesale caster wheels, handle locks, and cabinet fittings from Dhaka’s hardware market. Warehouse dispatch for shops, furniture factories, and contractors across Bangladesh.'}
          </p>
          <div className="mt-4 flex gap-2">
            <a href={`tel:${SUPPORT.phone}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label={bn ? 'ফোন' : 'Phone'}>
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="WhatsApp">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="Facebook">
              <IconFacebook />
            </a>
          </div>
        </div>

        <div>
          <h2 className={headingClass}>{bn ? 'প্রয়োজনীয় লিংক' : 'Useful links'}</h2>
          <ul className="mt-4 space-y-2">
            <li><Link className={linkClass} to="/orders">{bn ? 'অর্ডার ট্র্যাক করুন' : 'Track an order'}</Link></li>
            <li><Link className={linkClass} to="/terms">{bn ? 'হোলসেল টার্মস' : 'Wholesale terms'}</Link></li>
            <li><Link className={linkClass} to="/returns">{bn ? 'রিটার্ন ও রিফান্ড নীতি' : 'Return & refund policy'}</Link></li>
            <li>
              <button type="button" onClick={openHelpDesk} className={`${linkClass} text-left`}>
                {bn ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'FAQ'}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={headingClass}>{bn ? 'মূল ক্যাটাগরি' : 'Main categories'}</h2>
          <ul className="mt-4 space-y-3">
            {FOOTER_CATEGORIES.map((item) => (
              <li key={item.id}>
                <Link className={linkClass} to={categoryHref(categories, item.slugs)}>
                  {bn ? item.bn : item.en}
                </Link>
                {item.noteBn && (
                  <p className="text-xs text-slate-400">{bn ? item.noteBn : item.noteEn}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={headingClass}>{bn ? 'যোগাযোগ ও গুদাম' : 'Contact & warehouse'}</h2>
          <div className="mt-4 flex gap-2 text-sm leading-relaxed text-slate-300">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
            <p>
              <span className="font-bold text-white">{bn ? 'ঠিকানা' : 'Address'}</span>
              <br />
              {bn
                ? 'নবাবপুর / ধোলাইখাল ইন্ডাস্ট্রিয়াল মার্কেট, ঢাকা, বাংলাদেশ'
                : 'Nawabpur / Dholaikhal Industrial Market, Dhaka, Bangladesh'}
            </p>
          </div>
          <div className="mt-4 space-y-1 text-sm text-slate-300">
            <p className="font-bold text-white">{bn ? 'ফোন / WhatsApp সাপোর্ট' : 'Phone / WhatsApp support'}</p>
            <a className="block hover:text-white" href={`tel:${SUPPORT.phone}`}>{prettyPhone(SUPPORT.phone)}</a>
            <a className="block hover:text-white" href={`tel:${SUPPORT.phoneAlt}`}>{prettyPhone(SUPPORT.phoneAlt)}</a>
            <a className="mt-1 inline-flex font-semibold text-amber-200 hover:text-white" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {bn ? 'লজিস্টিক পার্টনারস' : 'Logistics partners'}
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {LOGISTICS.map((item) => (
                <li key={item.en} className="text-xs leading-5 text-slate-300">
                  {bn ? item.bn : item.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-400">
            © {year} Yousuf Wholesale. {bn ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-white/5 px-3 py-1.5 text-xs font-bold text-amber-100">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {bn ? 'পাইকারি ট্রেড অ্যাসিওরেন্স' : 'Wholesale trade assurance'}
          </span>
        </div>
      </div>
    </footer>
  )
}
