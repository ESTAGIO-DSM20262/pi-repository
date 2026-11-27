import { useSyncExternalStore } from 'react'

const DESKTOP_QUERY = '(min-width: 640px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches
}

function getServerSnapshot() {
  return true
}

export function usePageSize({ mobile, desktop }: { mobile: number; desktop: number }) {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return isDesktop ? desktop : mobile
}
