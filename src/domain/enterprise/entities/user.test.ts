import { describe, expect, it } from 'vitest'
import { User } from './user'

describe('User', () => {
  it('cria um usuário derivando o papel do e-mail', () => {
    const result = User.create({
      name: 'João Silva',
      email: 'joao.silva@aluno.cps.sp.gov.br',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.name).toBe('João Silva')
      expect(result.value.emailAddress).toBe('joao.silva@aluno.cps.sp.gov.br')
      expect(result.value.role).toBe('student')
    }
  })

  it('deriva professor para e-mails institucionais', () => {
    const result = User.create({
      name: 'Carlos Pereira',
      email: 'carlos.pereira@cps.sp.gov.br',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.role).toBe('professor')
    }
  })

  it('retorna erro de domínio para e-mail inválido', () => {
    const result = User.create({
      name: 'Fulano',
      email: 'fulano@gmail.com',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value.name).toBe('InvalidInstitutionalEmailError')
    }
  })

  it('usa o id informado', () => {
    const result = User.create({ name: 'Ana Lima', email: 'ana.lima@cps.sp.gov.br' }, 'user-123')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.id.toString()).toBe('user-123')
    }
  })

  it('preenche padrões (emailVerified=false, image=null)', () => {
    const result = User.create({ name: 'Teste', email: 'teste@cps.sp.gov.br' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.emailVerified).toBe(false)
      expect(result.value.image).toBeNull()
      expect(result.value.createdAt).toBeInstanceOf(Date)
    }
  })
})
