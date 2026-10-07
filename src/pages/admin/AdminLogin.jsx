import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { BackButton } from '../../components/BackButton';
import { LanguageToggle } from '../../components/LanguageToggle';

const ALLOWED_ADMIN_EMAIL = 'ahariyan173@gmail.com';

export default function AdminLogin() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('ahariyan173@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const copy = lang === 'bn'
    ? {
        title: 'ব্যবস্থাপনায় প্রবেশ',
        subtitle: 'ইউসুফ এন্টারপ্রাইজ',
        email: 'ইমেইল',
        password: 'পাসওয়ার্ড',
        placeholder: 'আপনার গোপন পাসওয়ার্ড',
        submit: 'প্রবেশ করুন',
        loading: 'প্রবেশ হচ্ছে...',
        denied: 'এই ইমেইলে ব্যবস্থাপনার অনুমতি নেই।',
        badPassword: 'ভুল পাসওয়ার্ড দেওয়া হয়েছে! আবার চেষ্টা করুন।',
      }
    : {
        title: 'Admin login',
        subtitle: 'Yousuf Enterprise management',
        email: 'Admin email',
        password: 'Password',
        placeholder: 'Your password',
        submit: 'Log in',
        loading: 'Signing in...',
        denied: 'This email does not have admin access.',
        badPassword: 'Wrong password. Try again.',
      };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (email.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
      setErrorMsg(copy.denied);
      toast.error(copy.denied);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setErrorMsg(copy.badPassword);
      toast.error(copy.badPassword);
    } else {
      navigate('/admin/orders');
    }
    setLoading(false);
  };

  const field = 'h-11 w-full rounded-xl border border-stone-200 px-3 text-sm outline-none transition-all duration-200 focus:border-ink';

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-sm">
        <BackButton fallback="/" className="mb-4" />
        <div className="premium-card rounded-3xl p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-ink">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>
          </div>
          <LanguageToggle />
        </div>

        {errorMsg && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <label className="text-xs font-bold text-stone-600">
            {copy.email}
            <input className={`${field} mt-1`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="text-xs font-bold text-stone-600">
            {copy.password}
            <input
              className={`${field} mt-1`}
              type="password"
              required
              placeholder={copy.placeholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 rounded-2xl bg-ink text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {loading ? copy.loading : copy.submit}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
