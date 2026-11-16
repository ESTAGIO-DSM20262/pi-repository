import { useEffect } from 'react'

export function useRestoreFocus(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [active])
}
