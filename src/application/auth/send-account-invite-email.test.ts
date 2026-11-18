import { describe, expect, it } from 'vitest'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import { InvalidEmailError } from '@/domain/enterprise/errors/invalid-email-error'
import { InMemoryAccountInviteNotifier } from '@/test/repositories/in-memory-account-invite-notifier'
import { SendAccountInviteEmailUseCase } from './send-account-invite-email'

const input = {
  email: '  Maria@Fatec.SP.gov.br ',
  name: ' Maria ',
  inviteUrl: 'http://localhost:3000/definir-senha?token=abc',
}

describe('SendAccountInviteEmailUseCase', () => {
  it('notifica com o e-mail normalizado e o link do convite', async () => {
    const notifier = new InMemoryAccountInviteNotifier()
    const useCase = new SendAccountInviteEmailUseCase(notifier)

    const result = await useCase.execute(input)

    expect(result.isRight()).toBe(true)
    expect(notifier.notifications).toEqual([
      {
        to: 'maria@fatec.sp.gov.br',
        name: 'Maria',
        inviteUrl: 'http://localhost:3000/definir-senha?token=abc',
      },
    ])
  })

  it('rejeita e-mail inválido sem enviar', async () => {
    const notifier = new InMemoryAccountInviteNotifier()
    const useCase = new SendAccountInviteEmailUseCase(notifier)

    const result = await useCase.execute({ ...input, email: 'invalido' })

    expect(result.value).toBeInstanceOf(InvalidEmailError)
    expect(notifier.notifications).toHaveLength(0)
  })

  it('propaga falha de entrega como EmailDeliveryError', async () => {
    const notifier = new InMemoryAccountInviteNotifier()
    notifier.shouldFail = true
    const useCase = new SendAccountInviteEmailUseCase(notifier)

    const result = await useCase.execute(input)

    expect(result.value).toBeInstanceOf(EmailDeliveryError)
  })
})
