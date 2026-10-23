import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function ScrollManager() {
  const location = useLocation()
  const navType = useNavigationType()
  const here = `${location.pathname}${location.search}${location.hash}`
  const seenHere = useRef(null)

  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useEffect(() => {
    const key = `scroll:${location.key}`
    const pathKey = `scroll-path:${location.pathname}${location.search}`
    const unchanged = seenHere.current === here
    seenHere.current = here
    if (unchanged && navType === 'POP') return undefined
    if (navType === 'POP') {
      const raw = sessionStorage.getItem(key) ?? sessionStorage.getItem(pathKey)
      if (raw != null) {
        const y = Number(raw) || 0
        const restore = () => window.scrollTo(0, y)
        requestAnimationFrame(restore)
        const timer = window.setTimeout(restore, 60)
        return () => {
          window.clearTimeout(timer)
          sessionStorage.setItem(key, String(window.scrollY))
          sessionStorage.setItem(pathKey, String(window.scrollY))
        }
      }
    } else if (navType !== 'POP') {
      window.scrollTo(0, 0)
    }
    return () => {
      sessionStorage.setItem(key, String(window.scrollY))
      sessionStorage.setItem(pathKey, String(window.scrollY))
    }
  }, [here, location.key, location.pathname, location.search, navType])

  return null
}
