'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard, AuthCardHeader } from '@/components/ui/AuthCard'
import { Modal, type Notice } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { fieldErrorClass, infoBoxClass, mutedLinkClass, primaryButtonClass } from '@/libs/styles'
import { useResetOnLeave } from '@/libs/useResetOnLeave'
import { passwordRules } from '@/presentation/auth/validation'
import { changePassword } from '@/presentation/profile/change-password'
import { type ChangePasswordValues, changePasswordSchema } from '@/presentation/profile/validation'

const EMPTY_VALUES: ChangePasswordValues = { currentPassword: '', newPassword: '', confirm: '' }

const SUCCESS_NOTICE: Notice = {
  variant: 'success',
  title: 'Senha redefinida',
  description: 'Sua senha foi alterada com sucesso. Use a nova senha no próximo acesso.',
}

function failureNotice(message: string): Notice {
  return {
    variant: 'error',
    title: 'Não foi possível redefinir a senha',
    description: message,
  }
}

export function AccountChangePasswordForm() {
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_VALUES,
  })

  useResetOnLeave(() => {
    reset(EMPTY_VALUES)
    setNotice(null)
  })

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      const result = await changePassword({ currentPassword, newPassword })
      if (!result.ok) {
        setNotice(failureNotice(result.error))
        return
      }
      reset(EMPTY_VALUES)
      setNotice(SUCCESS_NOTICE)
    } catch {
      setNotice(failureNotice('Não foi possível redefinir a senha. Tente novamente.'))
    }
  })

  function closeNotice() {
    const succeeded = notice?.variant === 'success'
    setNotice(null)
    if (succeeded) router.replace('/perfil')
  }

  const newPassword = watch('newPassword')

  return (
    <AuthCard>
      <AuthCardHeader
        title="Redefinir senha"
        description="Informe a senha atual e crie uma nova senha para sua conta."
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <PasswordInput
            id="current-password"
            label="Senha atual"
            placeholder="Digite sua senha atual"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? true : undefined}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className={fieldErrorClass} role="alert">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <PasswordInput
            id="new-password"
            label="Nova senha"
            placeholder="Digite sua nova senha"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? true : undefined}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className={fieldErrorClass} role="alert">
              {errors.newPassword.message}
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
              const met = rule.test(newPassword ?? '')
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

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? 'Redefinindo…' : 'Redefinir senha'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/perfil" className={mutedLinkClass}>
          <i className="fi fi-rr-arrow-left flex" aria-hidden="true" />
          Voltar para o perfil
        </Link>
      </div>

      <Modal
        open={notice !== null}
        variant={notice?.variant ?? 'success'}
        title={notice?.title ?? ''}
        description={notice?.description ?? ''}
        buttonLabel={notice?.variant === 'success' ? 'Voltar ao perfil' : 'Entendi'}
        onClose={closeNotice}
      />
    </AuthCard>
  )
}
