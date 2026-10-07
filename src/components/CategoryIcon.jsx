export function CategoryIcon({ name = 'box', className = 'h-6 w-6' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'wheel') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8" {...common} />
        <circle cx="12" cy="12" r="2.2" {...common} />
        <path d="M12 4v3.2M12 16.8V20M4 12h3.2M16.8 12H20" {...common} />
      </svg>
    )
  }
  if (name === 'lock') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="5" y="10" width="14" height="10" rx="2" {...common} />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" {...common} />
      </svg>
    )
  }
  if (name === 'handle' || name === 'pull') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M7 8h10v8H7z" {...common} />
        <path d="M9 8V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V8M8 16v3M16 16v3" {...common} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 8.5 12 4l8 4.5V20H4V8.5z" {...common} />
      <path d="M9 20v-6h6v6" {...common} />
    </svg>
  )
}
