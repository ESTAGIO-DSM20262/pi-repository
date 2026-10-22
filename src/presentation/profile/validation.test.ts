import { describe, expect, it } from 'vitest'
import { changePasswordSchema, createProfileSchema, socialProfileUrlSchema } from './validation'

describe('socialProfileUrlSchema', () => {
  it('normaliza links válidos do GitHub', () => {
    const result = socialProfileUrlSchema('github').safeParse('  https://github.com/octocat/ ')
    expect(result.success && result.data).toBe('https://github.com/octocat')
  })

  it('converte campo vazio em null', () => {
    const result = socialProfileUrlSchema('linkedin').safeParse('   ')
    expect(result.success && result.data).toBeNull()
  })

  it('rejeita links fora do domínio oficial', () => {
    const result = socialProfileUrlSchema('linkedin').safeParse('https://evil.com/in/usuario')
    expect(result.success).toBe(false)
  })
})

describe('createProfileSchema', () => {
  const base = { githubUrl: '', linkedinUrl: '' }

  it('valida nome e e-mail do administrador', () => {
    const result = createProfileSchema(true).safeParse({ ...base, name: 'Al', email: 'x' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toEqual(expect.arrayContaining(['name', 'email']))
    }
  })

  it('normaliza o e-mail do administrador', () => {
    const result = createProfileSchema(true).safeParse({
      ...base,
      name: 'Administrador',
      email: ' Admin@Fatec.SP.gov.br ',
    })
    expect(result.success && result.data.email).toBe('admin@fatec.sp.gov.br')
  })

  it('não valida nome e e-mail de quem não é administrador', () => {
    const result = createProfileSchema(false).safeParse({ ...base, name: '', email: '' })
    expect(result.success).toBe(true)
  })
})

describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'Atual123', newPassword: 'NovaSenha1', confirm: 'NovaSenha1' }

  it('aceita senha forte e confirmada', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('exige a senha atual', () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha fraca', () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPassword: 'fraca',
      confirm: 'fraca',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita confirmação diferente', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirm: 'Outra123' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toEqual(['confirm'])
  })
})
