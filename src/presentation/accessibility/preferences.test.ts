import { describe, expect, it } from 'vitest'
import { ACCESSIBILITY_NO_FLASH_SCRIPT } from './no-flash-script'
import {
  ACCESSIBILITY_STORAGE_KEY,
  type AccessibilityPreferences,
  areDefaultPreferences,
  COLOR_MODES,
  countActivePreferences,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  parseAccessibilityPreferences,
  preferencesToAttributes,
  sanitizeAccessibilityPreferences,
  stepTextSize,
} from './preferences'

function runNoFlashScript(stored: string | null) {
  const attributes: Record<string, string> = {}
  const fakeWindow = {
    localStorage: { getItem: (key: string) => (key === ACCESSIBILITY_STORAGE_KEY ? stored : null) },
  }
  const fakeDocument = {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        attributes[name] = value
      },
    },
  }
  new Function('window', 'document', ACCESSIBILITY_NO_FLASH_SCRIPT)(fakeWindow, fakeDocument)
  return attributes
}

describe('sanitizeAccessibilityPreferences', () => {
  it('retorna o padrão para valores inválidos', () => {
    expect(sanitizeAccessibilityPreferences(null)).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
    expect(sanitizeAccessibilityPreferences('texto')).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
    expect(
      sanitizeAccessibilityPreferences({
        textSize: 999,
        theme: 'x',
        colorMode: 'y',
        highContrast: 1,
      }),
    ).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
  })

  it('preserva valores válidos', () => {
    const value: AccessibilityPreferences = {
      textSize: 150,
      theme: 'dark',
      highContrast: true,
      colorMode: 'tritanopia',
      underlineLinks: true,
      reduceMotion: true,
      highlightFocus: true,
    }
    expect(sanitizeAccessibilityPreferences(value)).toEqual(value)
  })
})

describe('parseAccessibilityPreferences', () => {
  it('trata ausência e JSON corrompido como padrão', () => {
    expect(parseAccessibilityPreferences(null)).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
    expect(parseAccessibilityPreferences('{quebrado')).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES)
  })
})

describe('modos de cores', () => {
  it('aceita todos os modos de daltonismo e rejeita desconhecidos', () => {
    for (const mode of COLOR_MODES) {
      expect(sanitizeAccessibilityPreferences({ colorMode: mode }).colorMode).toBe(mode)
    }
    expect(sanitizeAccessibilityPreferences({ colorMode: 'sepia' }).colorMode).toBe('default')
  })

  it('aplica no script o mesmo modo salvo', () => {
    for (const mode of COLOR_MODES) {
      expect(runNoFlashScript(JSON.stringify({ colorMode: mode }))['data-a11y-colors']).toBe(mode)
    }
  })
})

describe('stepTextSize', () => {
  it('avança e recua sem ultrapassar os limites', () => {
    expect(stepTextSize(100, 1)).toBe(110)
    expect(stepTextSize(125, -1)).toBe(110)
    expect(stepTextSize(100, -1)).toBe(100)
    expect(stepTextSize(200, 1)).toBe(200)
  })
})

describe('contagem de preferências ativas', () => {
  it('reconhece o estado padrão e conta alterações', () => {
    expect(areDefaultPreferences(DEFAULT_ACCESSIBILITY_PREFERENCES)).toBe(true)
    expect(countActivePreferences(DEFAULT_ACCESSIBILITY_PREFERENCES)).toBe(0)
    const changed = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      theme: 'dark' as const,
      textSize: 125 as const,
    }
    expect(areDefaultPreferences(changed)).toBe(false)
    expect(countActivePreferences(changed)).toBe(2)
  })
})

describe('script de aplicação antes da hidratação', () => {
  it('gera os mesmos atributos que preferencesToAttributes', () => {
    const preferences: AccessibilityPreferences = {
      textSize: 175,
      theme: 'dark',
      highContrast: true,
      colorMode: 'deuteranopia',
      underlineLinks: true,
      reduceMotion: true,
      highlightFocus: true,
    }
    expect(runNoFlashScript(JSON.stringify(preferences))).toEqual(
      preferencesToAttributes(preferences),
    )
  })

  it('aplica o padrão sem preferências salvas ou com dados inválidos', () => {
    const expected = preferencesToAttributes(DEFAULT_ACCESSIBILITY_PREFERENCES)
    expect(runNoFlashScript(null)).toEqual(expected)
    expect(runNoFlashScript('{quebrado')).toEqual(expected)
    expect(runNoFlashScript('{"textSize":999}')).toEqual(expected)
  })
})
