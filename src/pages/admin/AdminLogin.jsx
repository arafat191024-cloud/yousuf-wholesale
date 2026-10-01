import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ALLOWED_ADMIN_EMAIL = 'ahariyan173@gmail.com';

export default function AdminLogin() {
  const [email, setEmail] = useState('ahariyan173@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (email.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
      setErrorMsg('দুঃখিত! এই ইমেইলের অ্যাডমিন অ্যাক্সেস নেই।');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    });

    if (error) {
      setErrorMsg('ভুল পাসওয়ার্ড দেওয়া হয়েছে! আবার চেষ্টা করুন।');
    } else {
      navigate('/admin/orders');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '16px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#ffffff',
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '20px' }}>🔒 অ্যাডমিন লগইন</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>ইউসুফ এন্টারপ্রাইজ ম্যানেজমেন্ট</p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '14px',
            border: '1px solid #fca5a5'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              অ্যাডমিন ইমেইল
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              পাসওয়ার্ড
            </label>
            <input
              type="password"
              required
              placeholder="আপনার গোপন পাসওয়ার্ড"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              backgroundColor: loading ? '#94a3b8' : '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}