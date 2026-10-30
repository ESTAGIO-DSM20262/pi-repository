'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  ACCESSIBILITY_STORAGE_KEY,
  type AccessibilityPreferences,
  areDefaultPreferences,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  parseAccessibilityPreferences,
  preferencesToAttributes,
} from './preferences'

const listeners = new Set<() => void>()
let currentPreferences = DEFAULT_ACCESSIBILITY_PREFERENCES
let lastSerialized: string | null | undefined

function readStorage(): string | null | undefined {
  try {
    return window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
  } catch {
    return undefined
  }
}

function getSnapshot(): AccessibilityPreferences {
  const serialized = readStorage()
  if (serialized === undefined) return currentPreferences
  if (serialized !== lastSerialized) {
    lastSerialized = serialized
    currentPreferences = parseAccessibilityPreferences(serialized)
  }
  return currentPreferences
}

function getServerSnapshot(): AccessibilityPreferences {
  return DEFAULT_ACCESSIBILITY_PREFERENCES
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === ACCESSIBILITY_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function persist(next: AccessibilityPreferences) {
  currentPreferences = next
  try {
    if (areDefaultPreferences(next)) {
      window.localStorage.removeItem(ACCESSIBILITY_STORAGE_KEY)
      lastSerialized = null
    } else {
      const serialized = JSON.stringify(next)
      window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, serialized)
      lastSerialized = serialized
    }
  } catch {
    lastSerialized = undefined
  }
  emit()
}

interface AccessibilityContextValue {
  preferences: AccessibilityPreferences
  update: (patch: Partial<AccessibilityPreferences>) => void
  reset: () => void
  isModified: boolean
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    const root = document.documentElement
    for (const [name, value] of Object.entries(preferencesToAttributes(preferences))) {
      if (root.getAttribute(name) !== value) root.setAttribute(name, value)
    }
  }, [preferences])

  const update = useCallback((patch: Partial<AccessibilityPreferences>) => {
    persist({ ...getSnapshot(), ...patch })
  }, [])

  const reset = useCallback(() => {
    persist(DEFAULT_ACCESSIBILITY_PREFERENCES)
  }, [])

  const value = useMemo(
    () => ({ preferences, update, reset, isModified: !areDefaultPreferences(preferences) }),
    [preferences, update, reset],
  )

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext)
  if (!context) throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider')
  return context
}
