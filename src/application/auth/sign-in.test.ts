import { describe, expect, it } from 'vitest'
import { type Either, left, right } from '@/core/either'
import { User } from '@/domain/enterprise/entities/user'
import type { AuthenticationError } from '@/domain/enterprise/errors/authentication-error'
import { InvalidCredentialsError } from '@/domain/enterprise/errors/invalid-credentials-error'
import type {
  AuthRepository,
  EmailSignInResult,
  SignInCredentials,
} from '@/domain/enterprise/repositories/auth-repository'
import { SignInUseCase } from './sign-in'

function makeUser(): User {
  const result = User.create({ name: 'João', email: 'joao.silva@aluno.cps.sp.gov.br' }, 'user-1')
  if (result.isLeft()) throw new Error('setup inválido')
  return result.value
}

class InMemoryAuthRepository implements AuthRepository {
  lastCredentials: SignInCredentials | null = null
  shouldFail = false

  async signInWithEmail(credentials: SignInCredentials): Promise<EmailSignInResult> {
    this.lastCredentials = credentials
    if (this.shouldFail) return left(new InvalidCredentialsError())
    return right({ user: makeUser() })
  }

  async signInWithMicrosoft(): Promise<Either<AuthenticationError, void>> {
    return right<AuthenticationError, void>(undefined)
  }

  async signOut() {}
}

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
