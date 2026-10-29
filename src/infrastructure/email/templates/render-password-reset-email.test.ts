import { describe, expect, it } from 'vitest'
import { renderPasswordResetEmail } from './render-password-reset-email'

const resetUrl =
  'http://localhost:3000/api/auth/reset-password/abc123?callbackURL=%2Fredefinir-senha'

describe('renderPasswordResetEmail', () => {
  it('renderiza o HTML com o link e as cores da marca', async () => {
    const { subject, html } = await renderPasswordResetEmail({ name: 'Maria', resetUrl })

    expect(subject).toBe('Redefinição de senha • Acervo Acadêmico')
    expect(html).toContain('abc123')
    expect(html).toContain('background-color:rgb(178,0,0)')
    expect(html).toContain('Acervo Acadêmico')
    expect(html).toContain('Olá, Maria!')
  })

  it('converte as classes Tailwind em estilos inline em pixels', async () => {
    const { html } = await renderPasswordResetEmail({ name: 'Maria', resetUrl })

    expect(html).not.toContain('class=')
    expect(html).not.toMatch(/\d(\.\d+)?rem/)
  })

  it('escapa conteúdo informado pelo usuário', async () => {
    const { html } = await renderPasswordResetEmail({ name: '<script>x</script>', resetUrl })

    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('gera a versão em texto com o link e a saudação', async () => {
    const { text } = await renderPasswordResetEmail({ name: 'Maria', resetUrl })

    expect(text).toContain('Olá, Maria!')
    expect(text).toContain('abc123')
    expect(text).not.toContain('<')
  })

  it('usa saudação genérica quando não há nome', async () => {
    const { html } = await renderPasswordResetEmail({ name: '  ', resetUrl })

    expect(html).toContain('Olá!')
  })
})
