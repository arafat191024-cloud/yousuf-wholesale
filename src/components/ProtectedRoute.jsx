import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const ALLOWED_ADMIN_EMAIL = 'ahariyan173@gmail.com';

export default function ProtectedRoute({ children }) {
  const { t } = useLanguage();
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
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <p className="text-sm font-semibold text-stone-500">{t.checkingAuth}</p>
      </div>
    );
  }

  if (!session || session.user?.email !== ALLOWED_ADMIN_EMAIL) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
