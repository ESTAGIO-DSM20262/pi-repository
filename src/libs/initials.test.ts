import { describe, expect, it } from 'vitest'
import { comparePersonNames, formatPersonName, getNameInitials } from './initials'

describe('formatPersonName', () => {
  it('converts names saved in uppercase to conventional casing', () => {
    expect(formatPersonName('LUCAS GABRIEL DA SILVA')).toBe('Lucas Gabriel da Silva')
  })

  it('preserves accents and capitalization in hyphenated names', () => {
    expect(formatPersonName("MARIA-CLARA D'ÁVILA")).toBe("Maria-Clara D'Ávila")
  })

  it('returns an empty string for an absent name', () => {
    expect(formatPersonName('   ')).toBe('')
  })
})

describe('getNameInitials', () => {
  it('returns uppercase initials', () => {
    expect(getNameInitials(formatPersonName('LUCAS SILVA'))).toBe('LS')
  })
})

describe('comparePersonNames', () => {
  it('sorts names alphabetically without separating accented names', () => {
    const names = ['Lucas Silva', 'Beatriz Fernandes', 'Álvaro Santos', 'Mariana Souza']

    expect([...names].sort(comparePersonNames)).toEqual([
      'Álvaro Santos',
      'Beatriz Fernandes',
      'Lucas Silva',
      'Mariana Souza',
    ])
  })
})
