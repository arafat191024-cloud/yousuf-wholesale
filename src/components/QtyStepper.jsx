import { memo, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function stockToast(lang, max) {
  toast.error(lang === 'bn' ? `সর্বোচ্চ স্টক উপলব্ধ: ${max} পিস` : `Maximum stock available: ${max} pcs`)
}

export const QtyStepper = memo(function QtyStepper({
  value,
  min = 1,
  max,
  onChange,
  lang = 'bn',
  disabled = false,
  compact = false,
}) {
  const [draft, setDraft] = useState(String(value ?? min))
  const cap = Number.isFinite(Number(max)) ? Math.max(0, Number(max)) : Number.POSITIVE_INFINITY
  const floor = Math.max(1, Number(min) || 1)

  useEffect(() => {
    setDraft(String(value ?? floor))
  }, [value, floor])

  function emit(next, warn) {
    const safe = Math.max(floor, next)
    setDraft(String(safe))
    if (warn) stockToast(lang, safe)
    if (safe !== Number(value)) onChange(safe)
  }

  function normalize(raw, { clampEmpty = false } = {}) {
    if (raw === '' || raw == null) {
      if (clampEmpty) emit(floor, false)
      return
    }
    const parsed = parseInt(raw, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      if (clampEmpty) emit(floor, false)
      return
    }
    if (parsed > cap) {
      emit(Math.max(floor, cap === Number.POSITIVE_INFINITY ? parsed : cap), cap !== Number.POSITIVE_INFINITY)
      return
    }
    emit(parsed, false)
  }

  const btn = compact
    ? 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg font-bold transition-all duration-150 transform-gpu active:scale-95 hover:shadow-md disabled:opacity-40'
    : 'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-lg font-bold transition-all duration-150 transform-gpu active:scale-95 hover:shadow-md disabled:opacity-40'

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={lang === 'bn' ? 'কমান' : 'Decrease'}
        disabled={disabled || Number(value) <= floor}
        className={btn}
        onClick={() => normalize(String(Math.max(floor, Number(value) - 1)), { clampEmpty: true })}
      >
        −
      </button>
      <input
        type="number"
        min={floor}
        max={Number.isFinite(cap) ? cap : undefined}
        inputMode="numeric"
        disabled={disabled}
        value={draft}
        onChange={(e) => {
          const raw = e.target.value
          setDraft(raw)
          if (raw === '') return
          normalize(raw)
        }}
        onBlur={() => normalize(draft, { clampEmpty: true })}
        className={`${compact ? 'h-10 w-14' : 'h-11 w-16'} rounded-xl border border-slate-200/80 bg-white text-center text-sm font-extrabold outline-none transition-all duration-150 focus:border-ink disabled:opacity-40`}
      />
      <button
        type="button"
        aria-label={lang === 'bn' ? 'বাড়ান' : 'Increase'}
        disabled={disabled || (Number.isFinite(cap) && Number(value) >= cap)}
        className={btn}
        onClick={() => normalize(String(Number(value) + 1), { clampEmpty: true })}
      >
        +
      </button>
    </div>
  )
})
