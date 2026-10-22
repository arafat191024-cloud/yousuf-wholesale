const listeners = new Set()

export function openHelpDesk() {
  listeners.forEach((listener) => listener())
}

export function subscribeHelpDesk(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
