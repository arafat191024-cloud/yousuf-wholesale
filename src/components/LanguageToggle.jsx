import { useLanguage } from '../context/LanguageContext'

export function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLanguage()
  const base = 'inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-xs font-bold transition-all duration-200 ease-out'

  return (
    <div className={`inline-flex items-center rounded-full border border-slate-200/80 bg-white p-0.5 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLang('bn')}
        className={`${base} ${lang === 'bn' ? 'bg-ink text-white shadow-sm' : 'text-slate-600 hover:text-ink'}`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? 'bg-ink text-white shadow-sm' : 'text-slate-600 hover:text-ink'}`}
      >
        English
      </button>
    </div>
  )
}
