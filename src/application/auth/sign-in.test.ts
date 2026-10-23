import { describe, expect, it } from 'vitest'
import { InMemoryAuthRepository } from '@/test/repositories/in-memory-auth-repository'
import { SignInUseCase } from './sign-in'

describe('SignInUseCase', () => {
  it('normaliza o e-mail antes de delegar ao repositório', async () => {
    const repository = new InMemoryAuthRepository()
    const useCase = new SignInUseCase(repository)

    const result = await useCase.execute({
      email: '  Joao.Silva@Aluno.CPS.sp.gov.br ',
      password: 'segredo',
    })

    expect(repository.lastCredentials).toEqual({
      email: 'joao.silva@aluno.cps.sp.gov.br',
      password: 'segredo',
    })
    expect(result.isRight()).toBe(true)
  })

  it('propaga o erro de credenciais inválidas como Left', async () => {
    const repository = new InMemoryAuthRepository()
    repository.shouldFail = true
    const useCase = new SignInUseCase(repository)

    const result = await useCase.execute({ email: 'x@cps.sp.gov.br', password: 'errada' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value.message).toBe('E-mail ou senha incorretos.')
    }
  })
})
