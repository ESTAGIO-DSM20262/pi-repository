import { describe, expect, it } from 'vitest'
import { isFirstAccessAllowedPath } from './first-access'

describe('isFirstAccessAllowedPath', () => {
  it('libera apenas a tela de primeiro acesso e a redefinição por e-mail', () => {
    expect(isFirstAccessAllowedPath('/primeiro-acesso')).toBe(true)
    expect(isFirstAccessAllowedPath('/redefinir-senha')).toBe(true)
    expect(isFirstAccessAllowedPath('/aluno')).toBe(false)
    expect(isFirstAccessAllowedPath('/primeiro-acesso-falso')).toBe(false)
    expect(isFirstAccessAllowedPath('/')).toBe(false)
  })
})
