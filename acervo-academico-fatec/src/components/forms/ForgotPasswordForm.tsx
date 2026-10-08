'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthCard, { AuthCardHeader } from '@/components/ui/AuthCard'
import Modal, { type Notice } from '@/components/ui/Modal'
import {
  descriptionClass, infoBoxClass, inputClass, labelClass,
  linkClass, mutedLinkClass, primaryButtonClass, titleClass,
} from '../../libs/styles'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { requestPasswordReset } from '@/services/auth.service'

const SHOW_DEMO = process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== 'false'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useResetOnLeave(() => {
    setEmail('')
    setStep('form')
    setSubmitting(false)
    setNotice(null)
  })

  async function send() {
    setSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
      return true
    } catch (err) {
      setNotice({
        variant: 'error',
        title: 'Não foi possível enviar',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
      })
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) {
      setNotice({
        variant: 'warning',
        title: 'Informe seu e-mail',
        description: 'Digite seu e-mail institucional para receber o link de recuperação.',
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
    if (await send()) setStep('sent')
  }

  async function handleResend() {
    if (await send()) {
      setNotice({
        variant: 'success',
        title: 'E-mail reenviado',
        description: 'Enviamos um novo link para o seu e-mail. Se não encontrar, confira também a caixa de spam.',
      })
    }
  }

  const noticeModal = (
    <Modal
      open={notice !== null}
      variant={notice?.variant ?? 'warning'}
      title={notice?.title ?? ''}
      description={notice?.description ?? ''}
      buttonLabel="Entendi"
      onClose={() => setNotice(null)}
    />
  )

  if (step === 'sent') {
    return (
      <AuthCard
        footer={
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-text-secondary sm:text-xs">
            <i className="fi fi-rr-lock flex text-emerald-700" aria-hidden="true" />
            Ambiente acadêmico seguro • Fatec Itaquera
          </p>
        }
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16 border border-border bg-surface-secondary text-primary">
            <i className="fi fi-rr-envelope-dot flex text-xl leading-none sm:text-2xl" aria-hidden="true" />
          </div>

          <h1 className={`mt-5 ${titleClass}`}>Verifique seu e-mail</h1>
          <p className="mt-2 text-[13px] font-medium leading-relaxed text-foreground sm:text-sm">
            Se o endereço informado estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <p className={`mt-2 ${descriptionClass}`}>
            Acesse sua caixa de entrada e clique no link enviado para continuar.
          </p>

          <div className={`mt-4 flex items-center justify-center gap-2 px-3 py-2 text-left text-[11px] text-text-secondary sm:py-2.5 sm:text-xs ${infoBoxClass}`}>
            <i className="fi fi-rr-clock flex shrink-0 text-primary" aria-hidden="true" />
            O link é temporário e ficará disponível por tempo limitado.
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={submitting}
            className={`mt-5 inline-flex cursor-pointer items-center gap-2 text-[13px] sm:text-sm disabled:cursor-wait disabled:opacity-60 ${linkClass}`}
          >
            <i className="fi fi-rr-envelope-plus flex" aria-hidden="true" />
            {submitting ? 'Reenviando…' : 'Reenviar e-mail'}
          </button>

          {SHOW_DEMO && (
            <Link
              href="/redefinir-senha?token=demo"
              className="mt-4 block rounded-lg bg-surface-secondary px-3 py-2 text-[11px] text-text-muted transition hover:text-primary sm:text-xs"
            >
              Demonstração: clique aqui para simular o link recebido por e-mail
            </Link>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <Link href="/login" className={mutedLinkClass}>
              <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
              Voltar para o login
            </Link>
          </div>
        </div>
        {noticeModal}
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <AuthCardHeader
        title="Esqueceu sua senha?"
        description="Informe seu e-mail institucional para receber um link de recuperação de senha."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>E-mail institucional</label>
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

        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-text-secondary sm:text-sm">
        Lembrou da senha?{' '}
        <Link href="/login" className={linkClass}>Entrar</Link>
      </p>

      {noticeModal}
    </AuthCard>
  )
}