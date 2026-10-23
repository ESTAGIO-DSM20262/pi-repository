import { describe, expect, it } from 'vitest'
import { AuthenticationError } from '@/domain/enterprise/errors/authentication-error'
import { InMemoryAuthRepository } from '@/test/repositories/in-memory-auth-repository'
import { RequestPasswordResetUseCase } from './request-password-reset'

describe('RequestPasswordResetUseCase', () => {
  it('normaliza o e-mail e repassa o redirecionamento', async () => {
    const repository = new InMemoryAuthRepository()
    const useCase = new RequestPasswordResetUseCase(repository)

    const result = await useCase.execute({
      email: '  Maria@Fatec.SP.gov.br ',
      redirectTo: '/redefinir-senha',
    })

    expect(repository.lastResetRequest).toEqual({
      email: 'maria@fatec.sp.gov.br',
      redirectTo: '/redefinir-senha',
    })
    expect(result.isRight()).toBe(true)
  })

  it('propaga a falha do repositório como Left', async () => {
    const repository = new InMemoryAuthRepository()
    repository.shouldFail = true
    const useCase = new RequestPasswordResetUseCase(repository)

    const result = await useCase.execute({
      email: 'x@fatec.sp.gov.br',
      redirectTo: '/redefinir-senha',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AuthenticationError)
  })
})
