export const TEXT_SIZE_LEVELS = [100, 110, 125, 150, 175, 200] as const
export type TextSize = (typeof TEXT_SIZE_LEVELS)[number]

export const COLOR_MODES = ['default', 'protanopia', 'deuteranopia', 'tritanopia'] as const
export type ColorMode = (typeof COLOR_MODES)[number]

export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export interface AccessibilityPreferences {
  textSize: TextSize
  theme: Theme
  highContrast: boolean
  colorMode: ColorMode
  underlineLinks: boolean
  reduceMotion: boolean
  highlightFocus: boolean
}

export const ACCESSIBILITY_STORAGE_KEY = 'acervo:a11y:v1'

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  textSize: 100,
  theme: 'light',
  highContrast: false,
  colorMode: 'default',
  underlineLinks: false,
  reduceMotion: false,
  highlightFocus: false,
}

function isTextSize(value: unknown): value is TextSize {
  return TEXT_SIZE_LEVELS.some((level) => level === value)
}

function isColorMode(value: unknown): value is ColorMode {
  return COLOR_MODES.some((mode) => mode === value)
}

function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value)
}

export function sanitizeAccessibilityPreferences(raw: unknown): AccessibilityPreferences {
  const defaults = DEFAULT_ACCESSIBILITY_PREFERENCES
  if (typeof raw !== 'object' || raw === null) return defaults
  const source = raw as Record<string, unknown>

  return {
    textSize: isTextSize(source.textSize) ? source.textSize : defaults.textSize,
    theme: isTheme(source.theme) ? source.theme : defaults.theme,
    highContrast: source.highContrast === true,
    colorMode: isColorMode(source.colorMode) ? source.colorMode : defaults.colorMode,
    underlineLinks: source.underlineLinks === true,
    reduceMotion: source.reduceMotion === true,
    highlightFocus: source.highlightFocus === true,
  }
}

export function parseAccessibilityPreferences(serialized: string | null): AccessibilityPreferences {
  if (!serialized) return DEFAULT_ACCESSIBILITY_PREFERENCES
  try {
    return sanitizeAccessibilityPreferences(JSON.parse(serialized))
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFERENCES
  }
}

export function areDefaultPreferences(preferences: AccessibilityPreferences): boolean {
  const defaults = DEFAULT_ACCESSIBILITY_PREFERENCES
  return (
    preferences.textSize === defaults.textSize &&
    preferences.theme === defaults.theme &&
    preferences.highContrast === defaults.highContrast &&
    preferences.colorMode === defaults.colorMode &&
    preferences.underlineLinks === defaults.underlineLinks &&
    preferences.reduceMotion === defaults.reduceMotion &&
    preferences.highlightFocus === defaults.highlightFocus
  )
}

export function countActivePreferences(preferences: AccessibilityPreferences): number {
  const defaults = DEFAULT_ACCESSIBILITY_PREFERENCES
  return [
    preferences.textSize !== defaults.textSize,
    preferences.theme !== defaults.theme,
    preferences.highContrast,
    preferences.colorMode !== defaults.colorMode,
    preferences.underlineLinks,
    preferences.reduceMotion,
    preferences.highlightFocus,
  ].filter(Boolean).length
}

export function stepTextSize(current: TextSize, direction: 1 | -1): TextSize {
  const index = TEXT_SIZE_LEVELS.indexOf(current)
  const next = Math.min(Math.max(index + direction, 0), TEXT_SIZE_LEVELS.length - 1)
  return TEXT_SIZE_LEVELS[next]
}

export function preferencesToAttributes(
  preferences: AccessibilityPreferences,
): Record<string, string> {
  return {
    'data-a11y-text': String(preferences.textSize),
    'data-a11y-theme': preferences.theme,
    'data-a11y-contrast': preferences.highContrast ? 'high' : 'normal',
    'data-a11y-colors': preferences.colorMode,
    'data-a11y-underline': preferences.underlineLinks ? 'on' : 'off',
    'data-a11y-motion': preferences.reduceMotion ? 'reduce' : 'normal',
    'data-a11y-focus': preferences.highlightFocus ? 'strong' : 'normal',
  }
}
