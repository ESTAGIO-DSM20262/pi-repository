'use client'

import { useEffect, useState } from 'react'
import Modal, { type Notice } from '@/components/ui/Modal'

// Mensagens para os erros de callback OAuth devolvidos pelo better-auth
// (via `?error=<code>&error_description=<mensagem>`).
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INSTITUTIONAL_EMAIL:
    'Sua conta não pertence aos domínios institucionais permitidos (aluno.cps.sp.gov.br ou cps.sp.gov.br).',
  email_not_found:
    'Não foi possível obter um e-mail institucional da sua conta Microsoft. Confirme se ela possui um e-mail do CPS.',
  email_not_verified:
    'O e-mail da sua conta Microsoft não foi verificado. Procure a coordenação do curso.',
  signup_disabled:
    'Não há uma conta pré-provisionada para este e-mail. Procure a coordenação do curso.',
  state_not_found: 'A sessão de login expirou antes da conclusão. Tente novamente.',
  invalid_code: 'A autenticação foi cancelada ou expirou. Tente novamente.',
  unable_to_get_user_info: 'Não foi possível ler os dados da sua conta Microsoft. Tente novamente.',
}

const FALLBACK =
  'Não foi possível entrar com a Microsoft. Verifique sua conta institucional e tente novamente.'

export default function LoginFeedback() {
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (!error) return

    setNotice({
      variant: 'error',
      title: 'Falha ao entrar',
      description: ERROR_MESSAGES[error] ?? params.get('error_description') ?? FALLBACK,
    })
  }, [])

  const close = () => {
    setNotice(null)
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  if (!notice) return null

  return (
    <Modal
      open
      variant={notice.variant}
      title={notice.title}
      description={notice.description}
      buttonLabel="Entendi"
      onClose={close}
    />
  )
}
