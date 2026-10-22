import { describe, expect, it } from 'vitest'
import { InvalidResetTokenError } from '@/domain/enterprise/errors/invalid-reset-token-error'
import { InMemoryAuthRepository } from '@/test/repositories/in-memory-auth-repository'
import { ResetPasswordUseCase } from './reset-password'

describe('ResetPasswordUseCase', () => {
  it('redefine a senha com um token válido', async () => {
    const repository = new InMemoryAuthRepository()
    repository.validResetTokens.add('token-valido')
    const useCase = new ResetPasswordUseCase(repository)

    const result = await useCase.execute({ token: 'token-valido', newPassword: 'NovaSenha1' })

    expect(result.isRight()).toBe(true)
    expect(repository.lastResetInput).toEqual({ token: 'token-valido', newPassword: 'NovaSenha1' })
  })

  it('propaga token inválido ou já usado como InvalidResetTokenError', async () => {
    const repository = new InMemoryAuthRepository()
    repository.validResetTokens.add('token-valido')
    const useCase = new ResetPasswordUseCase(repository)

    await useCase.execute({ token: 'token-valido', newPassword: 'NovaSenha1' })
    const result = await useCase.execute({ token: 'token-valido', newPassword: 'OutraSenha1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidResetTokenError)
  })
})
