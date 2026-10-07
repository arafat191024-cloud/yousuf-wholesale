import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export function BackButton({ fallback = '/', onClick, className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  function goBack() {
    if (onClick) {
      onClick()
      return
    }
    if (location.key !== 'default') navigate(-1)
    else navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-sm font-bold text-ink shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md ${className}`}
    >
      <span aria-hidden="true">←</span>
      {t.back}
    </button>
  )
}
