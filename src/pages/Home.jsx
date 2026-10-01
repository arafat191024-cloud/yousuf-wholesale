import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

export function Home() {
  const [categories, setCategories] = useState([])
  const { lang, toggleLanguage, t } = useLanguage()

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data }) => setCategories(data || []))
  }, [])

  // ডিরেক্ট ভেরিফায়েড হার্ডওয়্যার পণ্যের ছবি ও সঠিক নাম
const categoryConfig = {
'wheels': {
      titleEn: 'Wheels & Castors',
      titleBn: 'চাকা / হুইল',
      descEn: 'Durable Wheels for Smooth Movement',
      descBn: 'মসৃণ চলাচলের জন্য দীর্ঘস্থায়ী হেভি হুইল',
      image: '/wheels.png', // আপনার সেভ করা ফাইলের নাম
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v6m0 8v6M2 12h6m8 0h6"/>
        </svg>
      )
    },
    'door-locks': {
      titleEn: 'Door Locks',
      titleBn: 'ডোর লক ও তালা',
      descEn: 'Heavy brass padlocks and rim locks',
      descBn: 'বাসাবাড়ি ও দোকানের সর্বোচ্চ নিরাপত্তা লক',
      // Real brass security padlock
      image: 'https://images.pexels.com/photos/279810/pexels-photo-279810.jpeg?auto=compress&cs=tinysrgb&w=600',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )
    },
    'handle-locks': {
      titleEn: 'Handle Locks',
      titleBn: 'লাক্সারি হ্যান্ডেল লক',
      descEn: 'Modern mortise handle lock sets',
      descBn: 'আধুনিক নকশার ইন্টেরিয়র হ্যান্ডেল লক সেট',
      // Mortise lever handle lock on door
      image: 'https://images.pexels.com/photos/5691544/pexels-photo-5691544.jpeg?auto=compress&cs=tinysrgb&w=600',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
          <path d="M2 20h20"/>
          <circle cx="14" cy="12" r="2"/>
        </svg>
      )
    },
    'handles': {
      titleEn: 'Door & Cabinet Handles',
      titleBn: 'ডোর ও ক্যাবিনেট হ্যান্ডেল',
      descEn: 'Premium metal pull handles for doors',
      descBn: 'কাঠের দরজা ও ক্যাবিনেটের পুল হ্যান্ডেল',
      // Solid brass pull handle
      image: 'https://images.pexels.com/photos/7174391/pexels-photo-7174391.jpeg?auto=compress&cs=tinysrgb&w=600',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      )
    }
  }
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header & Language Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={toggleLanguage}
          style={{
            padding: '8px 18px',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#0f172a',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🌐 {lang === 'bn' ? 'Switch to English' : 'বাংলা ভার্সন'}
        </button>
      </div>

      {/* Hero Banner */}
      <section style={{
        padding: '50px 24px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
        color: '#ffffff',
        borderRadius: '24px',
        marginBottom: '40px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)'
      }}>
        <span style={{ 
          fontSize: '12px', 
          letterSpacing: '2px', 
          textTransform: 'uppercase', 
          background: 'rgba(255,255,255,0.1)', 
          padding: '6px 16px', 
          borderRadius: '30px',
          color: '#cbd5e1'
        }}>
          Direct Wholesale Importer
        </span>
        <h1 style={{ fontSize: '32px', margin: '16px 0 10px 0', fontWeight: '800' }}>
          {t.tagline}
        </h1>
        <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0' }}>
          {t.location}
        </p>
      </section>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>{t.noProducts}</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          paddingBottom: '40px'
        }}>
          {categories.map((c) => {
            const config = categoryConfig[c.slug] || {
              titleEn: c.name,
              titleBn: c.name,
              descEn: 'Quality Hardware Products',
              descBn: 'পাইকারি হার্ডওয়্যার সামগ্রী',
              image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Caster_wheel.jpg/640px-Caster_wheel.jpg',
              icon: '📦'
            }

            return (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '24px',
                  background: '#ffffff',
                  border: '1px solid #f1ece5',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(120, 90, 60, 0.06)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(120, 90, 60, 0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(120, 90, 60, 0.06)'
                }}
              >
                {/* প্রোডাক্ট ইমেজ ফ্রেম */}
                <div style={{
                  width: '100%',
                  height: '240px',
                  backgroundColor: '#f8fafc',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <img
                    src={config.image}
                    alt={c.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                {/* কনটেন্ট কার্ড ও গোল আইকন ব্যাজ */}
                <div style={{
                  position: 'relative',
                  padding: '38px 20px 24px 20px',
                  background: '#faf5f0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexGrow: 1
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-26px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#8f4f38',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(143, 79, 56, 0.35)',
                    border: '3px solid #ffffff'
                  }}>
                    {config.icon}
                  </div>

                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#2b1b17',
                    margin: '0 0 6px 0'
                  }}>
                    {lang === 'bn' ? config.titleBn : config.titleEn}
                  </h3>

                  <p style={{
                    fontSize: '13px',
                    color: '#7c6a63',
                    lineHeight: '1.4',
                    margin: '0 0 14px 0',
                    maxWidth: '220px'
                  }}>
                    {lang === 'bn' ? config.descBn : config.descEn}
                  </p>

                  <div style={{
                    width: '32px',
                    height: '4px',
                    background: '#d4a373',
                    borderRadius: '2px',
                    marginTop: 'auto'
                  }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}