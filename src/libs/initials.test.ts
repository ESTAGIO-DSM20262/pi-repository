import { describe, expect, it } from 'vitest'
import { comparePersonNames, formatPersonName, getNameInitials } from './initials'

describe('formatPersonName', () => {
  it('converte nomes salvos em maiúsculas para capitalização convencional', () => {
    expect(formatPersonName('LUCAS GABRIEL DA SILVA')).toBe('Lucas Gabriel da Silva')
  })

  it('preserva acentos e capitalização em nomes hifenizados', () => {
    expect(formatPersonName("MARIA-CLARA D'ÁVILA")).toBe("Maria-Clara D'Ávila")
  })

  it('retorna uma string vazia quando o nome está ausente', () => {
    expect(formatPersonName('   ')).toBe('')
  })
})

describe('getNameInitials', () => {
  it('retorna iniciais em maiúsculas', () => {
    expect(getNameInitials(formatPersonName('LUCAS SILVA'))).toBe('LS')
  })
})

describe('comparePersonNames', () => {
  it('ordena nomes alfabeticamente sem separar nomes acentuados', () => {
    const names = ['Lucas Silva', 'Beatriz Fernandes', 'Álvaro Santos', 'Mariana Souza']

    expect([...names].sort(comparePersonNames)).toEqual([
      'Álvaro Santos',
      'Beatriz Fernandes',
      'Lucas Silva',
      'Mariana Souza',
    ])
  })
})
