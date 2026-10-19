import { describe, expect, it } from 'vitest'
import { EmailAddress } from './email-address'

describe('EmailAddress', () => {
  it('normaliza espaços e caixa do endereço', () => {
    const result = EmailAddress.create('  Ana.Lima@Example.COM  ')
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.address).toBe('ana.lima@example.com')
  })

  it('aceita endereços de diferentes provedores', () => {
    expect(EmailAddress.isValid('aluno@gmail.com')).toBe(true)
    expect(EmailAddress.isValid('professor@outlook.com')).toBe(true)
    expect(EmailAddress.isValid('secretaria@cps.sp.gov.br')).toBe(true)
  })

  it('rejeita valores com formato inválido', () => {
    expect(EmailAddress.create('sem-arroba').isLeft()).toBe(true)
    expect(EmailAddress.create('sem@dominio').isLeft()).toBe(true)
    expect(EmailAddress.create('').isLeft()).toBe(true)
  })
})
