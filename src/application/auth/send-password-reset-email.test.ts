import { describe, expect, it } from 'vitest'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import { InvalidEmailError } from '@/domain/enterprise/errors/invalid-email-error'
import { InMemoryPasswordResetNotifier } from '@/test/repositories/in-memory-password-reset-notifier'
import { SendPasswordResetEmailUseCase } from './send-password-reset-email'

const input = {
  email: '  Maria@Fatec.SP.gov.br ',
  name: ' Maria ',
  active: true,
  resetUrl: 'http://localhost:3000/api/auth/reset-password/abc?callbackURL=%2Fredefinir-senha',
}

describe('SendPasswordResetEmailUseCase', () => {
  it('notifica com o e-mail normalizado', async () => {
    const notifier = new InMemoryPasswordResetNotifier()
    const useCase = new SendPasswordResetEmailUseCase(notifier)

    const result = await useCase.execute(input)

    expect(result.isRight()).toBe(true)
    expect(notifier.notifications).toEqual([
      { to: 'maria@fatec.sp.gov.br', name: 'Maria', resetUrl: input.resetUrl },
    ])
  })

  it('não envia e-mail para contas inativas', async () => {
    const notifier = new InMemoryPasswordResetNotifier()
    const useCase = new SendPasswordResetEmailUseCase(notifier)

    const result = await useCase.execute({ ...input, active: false })

    expect(result.isRight()).toBe(true)
    expect(notifier.notifications).toHaveLength(0)
  })

  it('rejeita e-mail inválido', async () => {
    const notifier = new InMemoryPasswordResetNotifier()
    const useCase = new SendPasswordResetEmailUseCase(notifier)

    const result = await useCase.execute({ ...input, email: 'invalido' })

    expect(result.value).toBeInstanceOf(InvalidEmailError)
    expect(notifier.notifications).toHaveLength(0)
  })

  it('propaga falha de entrega como EmailDeliveryError', async () => {
    const notifier = new InMemoryPasswordResetNotifier()
    notifier.shouldFail = true
    const useCase = new SendPasswordResetEmailUseCase(notifier)

    const result = await useCase.execute(input)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmailDeliveryError)
  })
})
