import { describe, expect, it } from 'vitest'
import { User } from './user'

describe('User', () => {
  it('cria um usuário com e-mail genérico e papel padrão de aluno', () => {
    const result = User.create({ name: 'João Silva', email: 'joao@gmail.com' })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.name).toBe('João Silva')
      expect(result.value.emailAddress).toBe('joao@gmail.com')
      expect(result.value.role).toBe('student')
    }
  })

  it('respeita o papel explicitamente definido para professor', () => {
    const result = User.create({
      name: 'Carlos Pereira',
      email: 'carlos@gmail.com',
      role: 'professor',
    })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.role).toBe('professor')
  })

  it('respeita o perfil administrativo persistido na conta', () => {
    const result = User.create({ name: 'Secretaria', email: 'admin@example.com', role: 'admin' })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.role).toBe('admin')
  })

  it('retorna erro de domínio para e-mail inválido', () => {
    const result = User.create({ name: 'Fulano', email: 'fulano' })
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) expect(result.value.name).toBe('InvalidEmailError')
  })

  it('usa o id informado', () => {
    const result = User.create({ name: 'Ana Lima', email: 'ana@example.com' }, 'user-123')
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.id.toString()).toBe('user-123')
  })

  it('preenche padrões de email verificado, imagem e data de criação', () => {
    const result = User.create({ name: 'Teste', email: 'teste@example.com' })
    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.emailVerified).toBe(false)
      expect(result.value.image).toBeNull()
      expect(result.value.createdAt).toBeInstanceOf(Date)
    }
  })
})
