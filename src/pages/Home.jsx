import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { CategorySkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/EmptyState'

const categoryConfig = {
  wheels: {
    titleEn: 'Wheels & Castors',
    titleBn: 'চাকা / হুইল',
    descEn: 'Durable Wheels for Smooth Movement',
    descBn: 'মসৃণ চলাচলের জন্য দীর্ঘস্থায়ী হেভি হুইল',
    image: '/wheels.png',
  },
  'door-locks': {
    titleEn: 'Door Locks',
    titleBn: 'ডোর লক ও তালা',
    descEn: 'Heavy brass padlocks and rim locks',
    descBn: 'বাসাবাড়ি ও দোকানের সর্বোচ্চ নিরাপত্তা লক',
    image: 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  'handle-locks': {
    titleEn: 'Handle Locks',
    titleBn: 'লাক্সারি হ্যান্ডেল লক',
    descEn: 'Modern mortise handle lock sets',
    descBn: 'আধুনিক নকশার ইন্টেরিয়র হ্যান্ডেল লক সেট',
    image: 'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  handles: {
    titleEn: 'Door & Cabinet Handles',
    titleBn: 'ডোর ও ক্যাবিনেট হ্যান্ডেল',
    descEn: 'Premium metal pull handles for doors',
    descBn: 'কাঠের দরজা ও ক্যাবিনেটের পুল হ্যান্ডেল',
    image: 'https://images.pexels.com/photos/7174391/pexels-photo-7174391.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
}

export function Home() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const { lang, t } = useLanguage()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const primary = await supabase.from('categories').select('*').order('display_order', { ascending: true })
        let rows = primary.data
        if (primary.error) {
          const fallback = await supabase.from('categories').select('*')
          rows = fallback.data
        }
        if (!cancelled) setCategories(rows || [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (location.hash === '#categories') {
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, loading])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-center text-white shadow-lg sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brass/30 blur-3xl" />
        <span className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-300">
          {t.importer}
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">{t.tagline}</h1>
        <p className="mt-3 text-sm text-stone-400">{t.location}</p>
      </section>

      <div id="categories" className="scroll-mt-24 pt-8">
        <h2 className="mb-5 text-lg font-extrabold text-ink">{t.categories}</h2>
        {loading ? (
          <CategorySkeleton />
        ) : categories.length === 0 ? (
          <EmptyState icon="🏪" title={t.noProducts} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const config = categoryConfig[c.slug] || {
                titleEn: c.name,
                titleBn: c.name,
                descEn: 'Quality Hardware Products',
                descBn: 'পাইকারি হার্ডওয়্যার সামগ্রী',
                image: '/wheels.png',
              }
              return (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="h-56 overflow-hidden bg-stone-100">
                    <img
                      src={config.image}
                      alt={lang === 'bn' ? config.titleBn : config.titleEn}
                      className="h-full w-full object-cover transition-all duration-200 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-center bg-sand px-5 pb-6 pt-5 text-center">
                    <h3 className="text-lg font-extrabold text-ink">
                      {lang === 'bn' ? config.titleBn : config.titleEn}
                    </h3>
                    <p className="mt-1 max-w-[240px] text-sm leading-relaxed text-stone-500">
                      {lang === 'bn' ? config.descBn : config.descEn}
                    </p>
                    <span className="mt-4 text-xs font-bold uppercase tracking-wide text-brass">{t.viewProducts}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
