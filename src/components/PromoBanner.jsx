import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { HEADER_SHELL } from '../lib/layout'

const SWIPE_THRESHOLD = 36

function isInternal(link) {
  return String(link || '').startsWith('/') && !String(link).startsWith('//')
}

function Shell({ children }) {
  return <section className={`${HEADER_SHELL} my-3 sm:my-6`}>{children}</section>
}

function FallbackHero() {
  const { t } = useLanguage()
  return (
    <Shell>
      <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] px-5 py-8 text-white shadow-sm md:rounded-2xl sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-200">
          {t.importer}
        </span>
        <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{t.tagline}</h1>
        <p className="mt-2 text-sm text-slate-300">{t.shopName}</p>
        <p className="mt-1 text-sm text-slate-300">{t.location}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[t.trustRate, t.trustStock, t.importer].map((label) => (
            <span key={label} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white">
              {label}
            </span>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function BannerLink({ href, className, children }) {
  if (isInternal(href)) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export function PromoBanner() {
  const [banners, setBanners] = useState([])
  const [status, setStatus] = useState('loading')
  const [index, setIndex] = useState(0)
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )
  const [hovering, setHovering] = useState(false)
  const trackRef = useRef(null)
  const indexRef = useRef(0)
  const dragRef = useRef(null)
  const skipClick = useRef(false)
  indexRef.current = index

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
    const media = window.matchMedia('(min-width: 768px)')
    const onChange = () => setDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!desktop || hovering || banners.length < 2) return undefined
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [desktop, hovering, banners.length])

  function placeTrack(offset, animate) {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animate ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
    track.style.transform = `translate3d(calc(${-indexRef.current * 100}% + ${offset}px), 0, 0)`
  }

  useEffect(() => {
    placeTrack(0, true)
  }, [index, banners.length])

  function step(delta) {
    if (banners.length < 2) return
    setIndex((current) => (current + delta + banners.length) % banners.length)
  }

  function onTouchStart(event) {
    if (banners.length < 2) return
    const touch = event.changedTouches[0]
    dragRef.current = { x: touch.clientX, y: touch.clientY, axis: null }
    skipClick.current = false
  }

  function onTouchMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - drag.x
    const dy = touch.clientY - drag.y
    if (!drag.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (drag.axis !== 'x') return
    skipClick.current = Math.abs(dx) > 8
    placeTrack(dx, false)
  }

  function onTouchEnd(event) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.axis !== 'x') {
      placeTrack(0, true)
      return
    }
    const dx = (event.changedTouches[0]?.clientX || drag.x) - drag.x
    if (dx > SWIPE_THRESHOLD) step(-1)
    else if (dx < -SWIPE_THRESHOLD) step(1)
    else placeTrack(0, true)
  }

  function onClickCapture(event) {
    if (!skipClick.current) return
    event.preventDefault()
    event.stopPropagation()
    skipClick.current = false
  }

  if (status === 'loading') {
    return (
      <Shell>
        <div className="h-28 animate-pulse rounded-xl bg-gray-100 sm:h-40 md:rounded-2xl" />
      </Shell>
    )
  }

  if (banners.length === 0) return <FallbackHero />

  return (
    <Shell>
      <div
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClickCapture={onClickCapture}
      >
        <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm md:rounded-2xl">
          <div ref={trackRef} className="flex w-full will-change-transform">
            {banners.map((banner, slide) => (
              <BannerLink
                key={banner.id}
                href={banner.target_link || '/'}
                className="block w-full min-w-0 shrink-0 grow-0 basis-full"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  draggable="false"
                  loading={slide === 0 ? 'eager' : 'lazy'}
                  className="block h-auto w-full select-none object-contain md:object-cover"
                />
              </BannerLink>
            ))}
          </div>
        </div>

        {banners.length > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="hidden h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-ink shadow-sm md:inline-flex"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {banners.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.title}
                aria-current={dot === index ? 'true' : undefined}
                onClick={() => setIndex(dot)}
                className={`h-2 rounded-full transition-all ${dot === index ? 'w-5 bg-ink' : 'w-2 bg-slate-300'}`}
              />
            ))}
            <button
              type="button"
              onClick={() => step(1)}
              className="hidden h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-ink shadow-sm md:inline-flex"
              aria-label="Next banner"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
