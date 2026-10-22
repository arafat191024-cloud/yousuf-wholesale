import { useEffect, useState } from 'react'

/**
 * On phones, hide the sticky header while the shopper scrolls down
 * and bring it back when they scroll up. Desktop stays put.
 */
export function useHeaderAutoHide() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    let lastY = window.scrollY
    let frame = 0

    function onScroll() {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        if (!mobileQuery.matches) {
          setHidden(false)
          lastY = window.scrollY
          return
        }
        const y = window.scrollY
        const delta = y - lastY
        if (y < 48) setHidden(false)
        else if (delta > 8) setHidden(true)
        else if (delta < -8) setHidden(false)
        lastY = y
      })
    }

    function onChange() {
      if (!mobileQuery.matches) setHidden(false)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    mobileQuery.addEventListener('change', onChange)
    return () => {
      window.removeEventListener('scroll', onScroll)
      mobileQuery.removeEventListener('change', onChange)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return hidden
}
