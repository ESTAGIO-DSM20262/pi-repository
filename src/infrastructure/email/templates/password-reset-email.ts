export interface PasswordResetEmailContent {
  subject: string
  html: string
  text: string
}

interface PasswordResetEmailInput {
  name: string
  resetUrl: string
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character])
}

export function renderPasswordResetEmail({
  name,
  resetUrl,
}: PasswordResetEmailInput): PasswordResetEmailContent {
  const greeting = name ? `Olá, ${name}!` : 'Olá!'
  const safeGreeting = escapeHtml(greeting)
  const safeUrl = escapeHtml(resetUrl)

  const subject = 'Redefinição de senha • Acervo Acadêmico'

  const text = [
    greeting,
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta no Acervo Acadêmico.',
    'Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):',
    '',
    resetUrl,
    '',
    'Se você não fez essa solicitação, ignore este e-mail. Sua senha atual continuará funcionando.',
  ].join('\n')

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#8d0000;">Acervo Acadêmico</p>
          <h1 style="margin:0 0 16px;font-size:20px;">Redefinição de senha</h1>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">${safeGreeting}</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link é válido por 1 hora.</p>
          <p style="margin:0 0 24px;">
            <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#8d0000;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Redefinir senha</a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#64748b;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;line-height:1.6;word-break:break-all;"><a href="${safeUrl}" style="color:#8d0000;">${safeUrl}</a></p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">Se você não fez essa solicitação, ignore este e-mail. Sua senha atual continuará funcionando.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
