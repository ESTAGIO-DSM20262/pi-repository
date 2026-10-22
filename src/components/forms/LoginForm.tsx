'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal, type Notice } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { useAuth } from '@/presentation/auth/auth-context'
import { type LoginValues, loginSchema } from '@/presentation/auth/validation'
import {
  buttonClass,
  fieldErrorClass,
  inputClass,
  labelClass,
  linkClass,
  primaryButtonClass,
} from '../../libs/styles'

export function LoginForm() {
  const router = useRouter()
  const { signIn, signInWithMicrosoft, showAuthAction, clearAuthAction } = useAuth()

  const [notice, setNotice] = useState<Notice | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  useResetOnLeave(() => {
    reset()
    setNotice(null)
  })

  useEffect(() => () => clearAuthAction(), [clearAuthAction])

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null)
    showAuthAction('Estamos verificando suas credenciais…')

    try {
      await signIn(values)

      reset()
      router.push('/painel')
      router.refresh()
    } catch (err) {
      clearAuthAction()
      setNotice({
        variant: 'error',
        title: 'Não foi possível entrar',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
      })
    }
  })

  async function handleMicrosoft() {
    setNotice(null)
    showAuthAction('Conectando sua conta institucional à Microsoft…')

    try {
      await signInWithMicrosoft()
    } catch (err) {
      clearAuthAction()
      setNotice({
        variant: 'error',
        title: 'Não foi possível entrar com a Microsoft',
        description:
          err instanceof Error
            ? err.message
            : 'Sua conta não está habilitada. Verifique se a conta foi cadastrada e está habilitada.',
      })
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
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

        <div>
          <PasswordInput
            id="password"
            label="Senha"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p className={fieldErrorClass} role="alert">
              {errors.password.message}
            </p>
          )}
          <div className="mt-1.5 text-right">
            <Link href="/esqueci-senha" className={`text-xs sm:text-[13px] ${linkClass}`}>
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <div className="space-y-2.5">
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-text-muted sm:text-xs">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleMicrosoft}
            className={`${buttonClass} border border-[#8C8C8C] bg-white px-3 text-[#5E5E5E] hover:bg-[#f3f3f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0067b8]`}
            style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
          >
            <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden="true">
              <rect x="0" y="0" width="11" height="11" fill="#F25022" />
              <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
              <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
              <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
            </svg>
            Entrar com Microsoft
          </button>
        </div>
      </form>

      <Modal
        open={notice !== null}
        variant={notice?.variant ?? 'warning'}
        title={notice?.title ?? ''}
        description={notice?.description ?? ''}
        buttonLabel="Entendi"
        onClose={() => setNotice(null)}
      />
    </>
  )
}
