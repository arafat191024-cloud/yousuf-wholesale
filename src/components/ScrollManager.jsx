import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function ScrollManager() {
  const location = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    const key = `scroll:${location.key}`
    if (navType === 'POP' && location.key !== 'default') {
      const raw = sessionStorage.getItem(key)
      if (raw != null) {
        const y = Number(raw) || 0
        requestAnimationFrame(() => window.scrollTo(0, y))
      }
    } else if (navType !== 'POP') {
      window.scrollTo(0, 0)
    }
    return () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }
  }, [location.key, navType])

  return null
}
