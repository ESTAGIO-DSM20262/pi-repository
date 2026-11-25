'use client'

import { useEffect, useState } from 'react'
import { Modal, type Notice } from '@/components/ui/Modal'
import { resolveLoginErrorNotice } from '@/presentation/auth/login-error-notice'

export function LoginFeedback() {
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (!error) return

    setNotice(resolveLoginErrorNotice(error))
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
