'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import AuthCard, { AuthCardHeader } from '@/components/ui/AuthCard'
import Modal, { type Notice } from '@/components/ui/Modal'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { type ForgotPasswordValues, forgotPasswordSchema } from '@/presentation/auth/validation'
import {
  fieldErrorClass,
  inputClass,
  labelClass,
  linkClass,
  primaryButtonClass,
} from '../../libs/styles'

const DEFERRED_NOTICE: Notice = {
  variant: 'warning',
  title: 'Recuperação de senha em breve',
  description:
    'A redefinição de senha ainda não está disponível. Entre em contato com a coordenação para recuperar seu acesso.',
}

export default function ForgotPasswordForm() {
  const [notice, setNotice] = useState<Notice | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  useResetOnLeave(() => {
    reset()
    setNotice(null)
  })

  const onSubmit = handleSubmit(() => {
    setNotice(DEFERRED_NOTICE)
  })

  return (
    <AuthCard>
      <AuthCardHeader
        title="Esqueceu sua senha?"
        description="Informe seu e-mail institucional para receber um link de recuperação de senha."
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
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
            placeholder="Digite seu e-mail institucional"
            className={inputClass}
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p className={fieldErrorClass} role="alert">
              {errors.email.message}
            </p>
          )}
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
