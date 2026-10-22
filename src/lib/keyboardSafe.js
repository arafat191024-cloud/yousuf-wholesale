const SKIP_TYPES = new Set([
  'checkbox',
  'radio',
  'file',
  'range',
  'button',
  'submit',
  'reset',
  'hidden',
  'image',
  'color',
])

/** Keep the focused field above the mobile keyboard. */
export function scrollFieldIntoView(event) {
  const target = event?.target
  if (!target || typeof target.scrollIntoView !== 'function') return
  const tag = target.tagName
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return
  if (SKIP_TYPES.has(String(target.type || '').toLowerCase())) return

  const run = () => {
    if (!target.isConnected) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (window.matchMedia('(max-width: 767px)').matches) {
    window.setTimeout(run, 320)
  } else {
    run()
  }
}
