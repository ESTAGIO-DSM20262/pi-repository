import { describe, expect, it } from 'vitest'
import { InstitutionalEmail } from './institutional-email'

describe('InstitutionalEmail', () => {
  it('deriva o papel student para o domínio de aluno', () => {
    const result = InstitutionalEmail.create('Joao.Silva@Aluno.CPS.sp.gov.br')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.address).toBe('joao.silva@aluno.cps.sp.gov.br')
      expect(result.value.role).toBe('student')
    }
  })

  it('deriva o papel professor para o domínio institucional', () => {
    const result = InstitutionalEmail.create('maria.souza@cps.sp.gov.br')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.role).toBe('professor')
    }
  })

  it('normaliza espaços e caixa do endereço', () => {
    const result = InstitutionalEmail.create('  Ana.Lima@CPS.SP.GOV.BR  ')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.address).toBe('ana.lima@cps.sp.gov.br')
    }
  })

  it('rejeita domínios fora do Centro Paula Souza', () => {
    const result = InstitutionalEmail.create('aluno@gmail.com')

    expect(result.isLeft()).toBe(true)
  })

  it('não confunde sufixos de domínio parecidos', () => {
    expect(InstitutionalEmail.create('x@sub.aluno.cps.sp.gov.br').isLeft()).toBe(true)
    expect(InstitutionalEmail.create('x@aluno.cps.sp.gov.br').isRight()).toBe(true)
    expect(InstitutionalEmail.create('x@cps.sp.gov.br').isRight()).toBe(true)
  })

  it('rejeita valores sem domínio', () => {
    expect(InstitutionalEmail.create('sem-arroba').isLeft()).toBe(true)
    expect(InstitutionalEmail.create('sem@dominio').isLeft()).toBe(true)
    expect(InstitutionalEmail.create('').isLeft()).toBe(true)
  })

  it('expõe isValid como atalho booleano', () => {
    expect(InstitutionalEmail.isValid('joao.silva@aluno.cps.sp.gov.br')).toBe(true)
    expect(InstitutionalEmail.isValid('joao.silva@gmail.com')).toBe(false)
  })
})
