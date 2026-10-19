'use client'

import { useEffect, useState } from 'react'
import Modal, { type Notice } from '@/components/ui/Modal'

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: 'O endereço de e-mail informado é inválido.',
  email_not_found: 'Não foi possível obter um endereço de e-mail da sua conta Microsoft.',
  email_not_verified:
    'O e-mail da sua conta Microsoft não foi verificado. Procure a coordenação do curso.',
  signup_disabled:
    'Não há uma conta pré-provisionada para este e-mail. Procure a coordenação do curso.',
  state_not_found: 'A sessão de login expirou antes da conclusão. Tente novamente.',
  invalid_code: 'A autenticação foi cancelada ou expirou. Tente novamente.',
  unable_to_get_user_info: 'Não foi possível ler os dados da sua conta Microsoft. Tente novamente.',
}

const FALLBACK =
  'Não foi possível entrar com a Microsoft. Verifique a conta selecionada e tente novamente.'

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
