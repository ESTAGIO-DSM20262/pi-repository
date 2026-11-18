import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailDeliveryError } from '@/domain/enterprise/errors/email-delivery-error'
import { ResendAccountInviteNotifier } from './resend-account-invite-notifier'

const send = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

vi.mock('./templates/render-account-invite-email', () => ({
  renderAccountInviteEmail: async () => ({ subject: 'Convite', html: '<p></p>', text: '' }),
}))

const notification = {
  to: 'maria@fatec.sp.gov.br',
  name: 'Maria',
  inviteUrl: 'http://localhost:3000/definir-senha?token=abc',
}

function makeNotifier() {
  return new ResendAccountInviteNotifier({ apiKey: 'key', from: 'a@b.com', retryDelayMs: 0 })
}

const rateLimited = { data: null, error: { name: 'rate_limit_exceeded', message: 'Too many' } }

describe('ResendAccountInviteNotifier', () => {
  beforeEach(() => send.mockReset())

  it('repete o envio quando o Resend limita a taxa', async () => {
    send
      .mockResolvedValueOnce(rateLimited)
      .mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const result = await makeNotifier().notify(notification)

    expect(result.isRight()).toBe(true)
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('desiste depois de 3 tentativas limitadas', async () => {
    send.mockResolvedValue(rateLimited)

    const result = await makeNotifier().notify(notification)

    expect(result.value).toBeInstanceOf(EmailDeliveryError)
    expect(send).toHaveBeenCalledTimes(3)
  })

  it('não repete outros erros', async () => {
    send.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Bad' } })

    const result = await makeNotifier().notify(notification)

    expect(result.value).toBeInstanceOf(EmailDeliveryError)
    expect(send).toHaveBeenCalledTimes(1)
  })
})
