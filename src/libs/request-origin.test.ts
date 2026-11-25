import { describe, expect, it } from 'vitest'
import {
  isTrustedOrigin,
  isUnsafeApiRequest,
  shouldRejectCrossOriginRequest,
} from './request-origin'

const base = {
  method: 'POST',
  pathname: '/api/projects',
  origin: 'https://acervo.fatec.edu.br',
  host: 'acervo.fatec.edu.br',
  forwardedHost: null,
  configuredOrigin: 'https://acervo.fatec.edu.br',
}

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE', 'post']
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS']

describe('isUnsafeApiRequest', () => {
  it.each(WRITE_METHODS)('considera %s uma escrita', (method) => {
    expect(isUnsafeApiRequest(method, '/api/projects')).toBe(true)
  })

  it.each(READ_METHODS)('ignora %s', (method) => {
    expect(isUnsafeApiRequest(method, '/api/projects')).toBe(false)
  })

  it('ignora rotas fora de /api e as rotas do better-auth', () => {
    expect(isUnsafeApiRequest('POST', '/login')).toBe(false)
    expect(isUnsafeApiRequest('POST', '/api/auth/sign-in/email')).toBe(false)
  })
})

describe('isTrustedOrigin', () => {
  it('aceita o mesmo host', () => {
    expect(isTrustedOrigin(base)).toBe(true)
  })

  it('aceita requisições sem Origin (clientes que não são navegadores)', () => {
    expect(isTrustedOrigin({ ...base, origin: null })).toBe(true)
  })

  it('aceita o host encaminhado pelo proxy', () => {
    expect(
      isTrustedOrigin({
        ...base,
        host: 'interno.local:3000',
        forwardedHost: 'acervo.fatec.edu.br',
        configuredOrigin: null,
      }),
    ).toBe(true)
  })

  it('aceita a origem configurada em BETTER_AUTH_URL', () => {
    expect(isTrustedOrigin({ ...base, host: 'interno.local:3000' })).toBe(true)
  })

  it('rejeita outra origem', () => {
    expect(isTrustedOrigin({ ...base, origin: 'https://site-malicioso.example' })).toBe(false)
  })

  it('rejeita um subdomínio parecido', () => {
    expect(isTrustedOrigin({ ...base, origin: 'https://acervo.fatec.edu.br.evil.example' })).toBe(
      false,
    )
  })

  it('rejeita Origin inválido ou opaco', () => {
    expect(isTrustedOrigin({ ...base, origin: 'null' })).toBe(false)
    expect(isTrustedOrigin({ ...base, origin: 'não é uma url' })).toBe(false)
  })
})

describe('shouldRejectCrossOriginRequest', () => {
  it('rejeita escrita vinda de outra origem', () => {
    expect(shouldRejectCrossOriginRequest({ ...base, origin: 'https://evil.example' })).toBe(true)
  })

  it('não bloqueia leitura de outra origem (endpoint público de projetos indicados)', () => {
    expect(
      shouldRejectCrossOriginRequest({
        ...base,
        method: 'GET',
        pathname: '/api/projects/recommended',
        origin: 'https://www.fatecitaquera.cps.sp.gov.br',
      }),
    ).toBe(false)
  })

  it('não interfere nas rotas do better-auth', () => {
    expect(
      shouldRejectCrossOriginRequest({
        ...base,
        pathname: '/api/auth/sign-in/email',
        origin: 'https://evil.example',
      }),
    ).toBe(false)
  })

  it('deixa passar escrita da mesma origem', () => {
    expect(shouldRejectCrossOriginRequest(base)).toBe(false)
  })
})
