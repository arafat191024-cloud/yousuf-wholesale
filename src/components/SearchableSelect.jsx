import { useEffect, useMemo, useRef, useState } from 'react'

export function SearchableSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const selected = options.find((option) => option.value === value)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) =>
      [option.label, option.search, option.value].filter(Boolean).join(' ').toLowerCase().includes(needle)
    )
  }, [options, query])

  useEffect(() => {
    function onDoc(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <p className="mb-1 text-xs font-bold text-slate-600">
          {label}
          {required ? ' *' : ''}
        </p>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((current) => !current)
          setQuery('')
        }}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 text-left text-sm font-semibold text-ink outline-none transition-all duration-150 focus:border-ink disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span className={`truncate ${selected ? 'text-ink' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-ink"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-slate-500">—</li>
            )}
            {filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex w-full px-3 py-2.5 text-left text-sm font-semibold transition-all duration-150 hover:bg-slate-50 ${
                    option.value === value ? 'bg-ink text-white hover:bg-ink' : 'text-ink'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
