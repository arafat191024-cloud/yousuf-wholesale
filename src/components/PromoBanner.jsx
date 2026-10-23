import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

function isInternal(link) {
  return String(link || '').startsWith('/') && !String(link).startsWith('//')
}

function FallbackHero() {
  const { t } = useLanguage()
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] px-5 py-8 text-white shadow-md sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
      <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-200">
        {t.importer}
      </span>
      <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{t.tagline}</h1>
      <p className="mt-2 text-sm text-slate-300">{t.shopName}</p>
      <p className="mt-1 text-sm text-slate-300">{t.location}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[t.trustRate, t.trustStock, t.importer].map((label) => (
          <span key={label} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

export function PromoBanner() {
  const [banners, setBanners] = useState([])
  const [status, setStatus] = useState('loading')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('promotional_banners')
      .select('id, title, image_url, target_link, priority, created_at')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error(error)
          setBanners([])
          setStatus('ready')
          return
        }
        setBanners(data || [])
        setStatus('ready')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (banners.length < 2) return undefined
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [banners.length])

  if (status === 'loading') {
    return <div className="aspect-[16/9] animate-pulse rounded-[28px] bg-slate-200 sm:aspect-[21/8]" />
  }

  if (banners.length === 0) return <FallbackHero />

  const banner = banners[index] || banners[0]
  const href = banner.target_link || '/'
  const image = (
    <img
      src={banner.image_url}
      alt={banner.title}
      className="aspect-[16/9] w-full object-cover sm:aspect-[21/8]"
    />
  )
  const frameClass = 'block overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100 shadow-md'

  function step(delta) {
    setIndex((current) => (current + delta + banners.length) % banners.length)
  }

  function onTouchStart(event) {
    event.currentTarget.dataset.x = String(event.changedTouches[0]?.clientX || 0)
  }

  function onTouchEnd(event) {
    const start = Number(event.currentTarget.dataset.x || 0)
    const delta = (event.changedTouches[0]?.clientX || 0) - start
    if (delta > 48) step(-1)
    else if (delta < -48) step(1)
  }

  return (
    <div>
      {isInternal(href) ? (
        <Link to={href} className={frameClass} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {image}
        </Link>
      ) : (
        <a href={href} className={frameClass} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {image}
        </a>
      )}
      {banners.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {banners.map((item, dot) => (
            <button
              key={item.id}
              type="button"
              aria-label={item.title}
              onClick={() => setIndex(dot)}
              className={`h-2.5 rounded-full transition-all ${dot === index ? 'w-6 bg-ink' : 'w-2.5 bg-slate-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
