'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard, AuthCardHeader } from '@/components/ui/AuthCard'
import { Modal, type Notice } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { fieldErrorClass, infoBoxClass, mutedLinkClass, primaryButtonClass } from '@/libs/styles'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import {
  passwordRules,
  type ResetPasswordValues,
  resetPasswordSchema,
} from '@/presentation/auth/validation'

const DEFERRED_NOTICE: Notice = {
  variant: 'warning',
  title: 'Redefinição de senha em breve',
  description:
    'A redefinição de senha ainda não está disponível. Entre em contato com a coordenação para recuperar seu acesso.',
}

export function ResetPasswordForm() {
  const [deferred, setDeferred] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirm: '' },
  })

  useResetOnLeave(() => {
    reset()
    setDeferred(false)
  })

  const onSubmit = handleSubmit(() => setDeferred(true))

  const password = watch('password')

  return (
    <AuthCard>
      <AuthCardHeader
        title="Redefinir senha"
        description="Crie uma nova senha para acessar sua conta."
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <PasswordInput
            id="new-password"
            label="Nova senha"
            placeholder="Digite sua nova senha"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p className={fieldErrorClass} role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <PasswordInput
            id="confirm-password"
            label="Confirmar nova senha"
            placeholder="Confirme sua nova senha"
            autoComplete="new-password"
            aria-invalid={errors.confirm ? true : undefined}
            {...register('confirm')}
          />
          {errors.confirm && (
            <p className={fieldErrorClass} role="alert">
              {errors.confirm.message}
            </p>
          )}
        </div>

        <div className={`p-3 sm:p-4 ${infoBoxClass}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary sm:text-xs">
            Requisitos de segurança:
          </p>
          <ul className="mt-2 space-y-1.5">
            {passwordRules.map((rule) => {
              const met = rule.test(password)
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs sm:text-[13px] ${met ? 'text-emerald-700' : 'text-text-secondary'}`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 items-center justify-center rounded-full border transition ${
                      met
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-400 bg-white'
                    }`}
                  >
                    {met && (
                      <i
                        className="fi fi-br-check flex text-[7px] leading-none sm:text-[8px]"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  {rule.label}
                </li>
              )
            })}
          </ul>
        </div>

        <button type="submit" className={primaryButtonClass}>
          Redefinir senha
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/login" className={mutedLinkClass}>
          <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
          Voltar para o login
        </Link>
      </div>

      <Modal
        open={deferred}
        variant={DEFERRED_NOTICE.variant}
        title={DEFERRED_NOTICE.title}
        description={DEFERRED_NOTICE.description}
        buttonLabel="Entendi"
        onClose={() => setDeferred(false)}
      />
    </AuthCard>
  )
}
