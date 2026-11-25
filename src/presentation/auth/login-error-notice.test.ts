import { describe, expect, it } from 'vitest'
import { resolveLoginErrorNotice } from './login-error-notice'

describe('resolveLoginErrorNotice', () => {
  it.each([
    'signup_disabled',
    'SIGNUP_DISABLED',
    'unable_to_create_user',
  ])('orienta a procurar a secretaria quando o erro é %s', (code) => {
    const notice = resolveLoginErrorNotice(code)

    expect(notice.variant).toBe('warning')
    expect(notice.title).toBe('Conta não cadastrada')
    expect(notice.description).toContain('secretaria')
    expect(notice.description).toContain('cadastro')
  })

  it.each(['USER_DISABLED', 'unable_to_create_session'])(
    'informa conta desativada quando o erro é %s',
    (code) => {
      const notice = resolveLoginErrorNotice(code)

      expect(notice.variant).toBe('error')
      expect(notice.title).toBe('Conta desativada')
    },
  )

  it('traduz códigos conhecidos do fluxo OAuth', () => {
    const notice = resolveLoginErrorNotice('invalid_code')

    expect(notice.variant).toBe('error')
    expect(notice.title).toBe('Falha ao entrar')
    expect(notice.description).toContain('cancelada ou expirou')
  })

  it('usa a mensagem padrão para códigos desconhecidos', () => {
    const notice = resolveLoginErrorNotice('algo_inesperado')

    expect(notice.title).toBe('Falha ao entrar')
    expect(notice.description).toContain('Não foi possível entrar com a Microsoft')
  })

  it('não confunde propriedades herdadas do objeto com códigos de erro', () => {
    const notice = resolveLoginErrorNotice('constructor')

    expect(notice.title).toBe('Falha ao entrar')
    expect(notice.description).toContain('Não foi possível entrar com a Microsoft')
  })
})
