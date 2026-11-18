import { describe, expect, it } from 'vitest'
import { formatPersonName } from './person-name'

describe('formatPersonName', () => {
  it('converte nome em caixa alta para a primeira letra maiúscula de cada nome', () => {
    expect(formatPersonName('ADILSON JHONY ANTI GOMEZ')).toBe('Adilson Jhony Anti Gomez')
  })

  it('mantém preposições em minúscula', () => {
    expect(formatPersonName('CARLOS HENRIQUE DE JESUS COSTA')).toBe(
      'Carlos Henrique de Jesus Costa',
    )
    expect(formatPersonName('MARIA DAS GRAÇAS E SILVA DOS SANTOS')).toBe(
      'Maria das Graças e Silva dos Santos',
    )
  })

  it('preserva acentos e capitaliza partes com hífen ou apóstrofo', () => {
    expect(formatPersonName('JOÃO ÁLVARO')).toBe('João Álvaro')
    expect(formatPersonName("ANA-CLARA D'ÁVILA")).toBe("Ana-Clara D'Ávila")
  })

  it('normaliza espaços repetidos, nas pontas e espaço não separável', () => {
    expect(formatPersonName('  JOSÉ   DA  SILVA ')).toBe('José da Silva')
  })

  it('capitaliza a preposição quando ela é a primeira palavra', () => {
    expect(formatPersonName('DE LUCA')).toBe('De Luca')
  })

  it('mantém numerais romanos em maiúscula', () => {
    expect(formatPersonName('PEDRO ALVES III')).toBe('Pedro Alves III')
  })

  it('devolve vazio para texto vazio', () => {
    expect(formatPersonName('   ')).toBe('')
  })
})
