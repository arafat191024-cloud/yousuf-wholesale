import { useEffect } from 'react'

export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined
    const y = window.scrollY
    const previous = document.body.style.cssText
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return () => {
      document.body.style.cssText = previous
      window.scrollTo(0, y)
    }
  }, [locked])
}
