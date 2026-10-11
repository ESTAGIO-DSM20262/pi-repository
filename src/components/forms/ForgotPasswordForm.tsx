'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthCard, { AuthCardHeader } from '@/components/ui/AuthCard'
import Modal, { type Notice } from '@/components/ui/Modal'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { inputClass, labelClass, linkClass, primaryButtonClass } from '../../libs/styles'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)

  useResetOnLeave(() => {
    setEmail('')
    setNotice(null)
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email.trim()) {
      setNotice({
        variant: 'warning',
        title: 'Informe seu e-mail',
        description: 'Digite seu e-mail institucional para continuar.',
      })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setNotice({
        variant: 'warning',
        title: 'E-mail inválido',
        description: 'Digite um e-mail válido, por exemplo nome@cps.sp.gov.br.',
      })
      return
    }

    setNotice({
      variant: 'warning',
      title: 'Recuperação de senha em breve',
      description:
        'A redefinição de senha ainda não está disponível. Entre em contato com a coordenação para recuperar seu acesso.',
    })
  }

  return (
    <AuthCard>
      <AuthCardHeader
        title="Esqueceu sua senha?"
        description="Informe seu e-mail institucional para receber um link de recuperação de senha."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail institucional
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail institucional"
            className={inputClass}
          />
        </div>

        <button type="submit" className={primaryButtonClass}>
          Enviar link de recuperação
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-text-secondary sm:text-sm">
        Lembrou da senha?{' '}
        <Link href="/login" className={linkClass}>
          Entrar
        </Link>
      </p>

      <Modal
        open={notice !== null}
        variant={notice?.variant ?? 'warning'}
        title={notice?.title ?? ''}
        description={notice?.description ?? ''}
        buttonLabel="Entendi"
        onClose={() => setNotice(null)}
      />
    </AuthCard>
  )
}
