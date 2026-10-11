'use client'

import { useEffect, useRef } from 'react'

export function useResetOnLeave(reset: () => void) {
  const resetRef = useRef(reset)
  resetRef.current = reset

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetRef.current()
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      window.removeEventListener('pageshow', onPageShow)
      resetRef.current()
    }
  }, [])
}