import { useCallback, useEffect, useRef } from 'react'

const stack = []
let swallow = false

function place() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function pushEntry(kind) {
  const prev = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
  window.history.pushState({ ...prev, modalOpen: true, overlay: kind }, '')
}

/**
 * Keeps a modal, drawer, or search overlay in sync with the hardware back button.
 * Closing from the UI pops the same history entry the back gesture would.
 */
export function useOverlayHistory(active, onClose, kind = 'modal') {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const idRef = useRef({})
  const ownsRef = useRef(false)
  const backTimer = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const id = idRef.current
    const openedAt = place()
    if (backTimer.current) {
      window.clearTimeout(backTimer.current)
      backTimer.current = null
    }
    if (!ownsRef.current) {
      pushEntry(kind)
      stack.push(id)
      ownsRef.current = true
    }

    function onPop() {
      if (swallow) return
      if (stack[stack.length - 1] !== id) return
      stack.pop()
      ownsRef.current = false
      onCloseRef.current()
    }

    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (!ownsRef.current) return
      backTimer.current = window.setTimeout(() => {
        backTimer.current = null
        if (!ownsRef.current) return
        const index = stack.lastIndexOf(id)
        if (index === -1) {
          ownsRef.current = false
          return
        }
        stack.splice(index, 1)
        ownsRef.current = false
        if (place() !== openedAt) return
        swallow = true
        window.history.back()
      }, 0)
    }
  }, [active, kind])

  useEffect(() => () => {
    if (backTimer.current) window.clearTimeout(backTimer.current)
  }, [])

  return useCallback(() => {
    if (backTimer.current) {
      window.clearTimeout(backTimer.current)
      backTimer.current = null
    }
    const id = idRef.current
    const index = stack.lastIndexOf(id)
    if (index === -1) {
      ownsRef.current = false
      onCloseRef.current()
      return
    }
    stack.splice(index, 1)
    ownsRef.current = false
    swallow = true
    onCloseRef.current()
    window.history.back()
  }, [])
}

if (typeof window !== 'undefined' && !window.__yousufOverlayPop) {
  window.__yousufOverlayPop = true
  window.addEventListener('popstate', () => {
    if (!swallow) return
    window.setTimeout(() => {
      swallow = false
    }, 0)
  })
}
