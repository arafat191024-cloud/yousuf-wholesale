import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ALLOWED_ADMIN_EMAIL = 'ahariyan173@gmail.com';

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748b' }}>লগইন সিকিউরিটি যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  // লগইন না থাকলে বা ahariyan173@gmail.com না হলে লগইনে পাঠিয়ে দেবে
  if (!session || session.user?.email !== ALLOWED_ADMIN_EMAIL) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}