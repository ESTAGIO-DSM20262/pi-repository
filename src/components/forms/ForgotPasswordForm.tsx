'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard, AuthCardHeader } from '@/components/ui/AuthCard'
import { Modal, type Notice } from '@/components/ui/Modal'
import {
  fieldErrorClass,
  inputClass,
  labelClass,
  linkClass,
  primaryButtonClass,
} from '@/libs/styles'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { useAuth } from '@/presentation/auth/auth-context'
import { type ForgotPasswordValues, forgotPasswordSchema } from '@/presentation/auth/validation'

const SENT_NOTICE: Notice = {
  variant: 'success',
  title: 'Verifique seu e-mail',
  description:
    'Se houver uma conta com este e-mail, você receberá um link para redefinir a senha em instantes. Verifique também a caixa de spam.',
}

function failureNotice(error: unknown): Notice {
  return {
    variant: 'error',
    title: 'Não foi possível enviar o link',
    description:
      error instanceof Error ? error.message : 'Não foi possível enviar o link. Tente novamente.',
  }
}

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth()
  const [notice, setNotice] = useState<Notice | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  })

  useResetOnLeave(() => {
    reset()
    setNotice(null)
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await requestPasswordReset(email)
      reset()
      setNotice(SENT_NOTICE)
    } catch (error) {
      setNotice(failureNotice(error))
    }
  })

  return (
    <AuthCard>
      <AuthCardHeader
        title="Esqueceu sua senha?"
        description="Informe o e-mail da sua conta para receber um link de recuperação de senha."
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="Digite seu e-mail"
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

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Enviando…' : 'Enviar link de recuperação'}
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
