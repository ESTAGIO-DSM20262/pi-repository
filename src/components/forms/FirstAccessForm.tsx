'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard, AuthCardHeader } from '@/components/ui/AuthCard'
import { Modal, type Notice } from '@/components/ui/Modal'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { fieldErrorClass, infoBoxClass, mutedLinkClass, primaryButtonClass } from '@/libs/styles'
import { useAuth } from '@/presentation/auth/auth-context'
import {
  passwordRules,
  type ResetPasswordValues,
  resetPasswordSchema,
} from '@/presentation/auth/validation'

const SUCCESS_NOTICE: Notice = {
  variant: 'success',
  title: 'Senha pessoal criada',
  description: 'Pronto! Sua senha inicial não vale mais. Use a nova senha nos próximos acessos.',
}

function failureNotice(message: string): Notice {
  return { variant: 'error', title: 'Não foi possível salvar a senha', description: message }
}

export function FirstAccessForm({ name }: { name: string }) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [notice, setNotice] = useState<Notice | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      const response = await fetch('/api/account/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setNotice(failureNotice(data.error ?? 'Não foi possível salvar a nova senha.'))
        return
      }
      reset()
      setNotice(SUCCESS_NOTICE)
    } catch {
      setNotice(failureNotice('Não foi possível salvar a nova senha. Verifique sua conexão.'))
    }
  })

  function closeNotice() {
    const succeeded = notice?.variant === 'success'
    setNotice(null)
    // Recarrega por completo para a sessão trazer o estado atualizado da conta.
    if (succeeded) window.location.replace('/painel')
  }

  async function leave() {
    await signOut()
    router.replace('/login')
    router.refresh()
  }

  const password = watch('password')
  const firstName = name.trim().split(/\s+/)[0]

  return (
    <AuthCard>
      <AuthCardHeader
        title="Primeiro acesso"
        description={`${firstName ? `Olá, ${firstName}! ` : ''}Crie uma senha pessoal para continuar.`}
      />

      <div className={`mt-5 p-3 sm:p-4 ${infoBoxClass}`}>
        <p className="text-xs leading-relaxed text-text-secondary sm:text-[0.8125rem]">
          Você entrou com a senha inicial enviada para o seu e-mail. Por segurança, ela precisa ser
          trocada agora por uma senha só sua.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" noValidate>
        <div>
          <PasswordInput
            id="first-access-password"
            label="Nova senha"
            placeholder="Digite sua nova senha"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'first-access-password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="first-access-password-error" className={fieldErrorClass} role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <PasswordInput
            id="first-access-confirm"
            label="Confirmar nova senha"
            placeholder="Confirme sua nova senha"
            autoComplete="new-password"
            aria-invalid={errors.confirm ? true : undefined}
            aria-describedby={errors.confirm ? 'first-access-confirm-error' : undefined}
            {...register('confirm')}
          />
          {errors.confirm && (
            <p id="first-access-confirm-error" className={fieldErrorClass} role="alert">
              {errors.confirm.message}
            </p>
          )}
        </div>

        <div className={`p-3 sm:p-4 ${infoBoxClass}`}>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-text-secondary sm:text-xs">
            Requisitos de segurança:
          </p>
          <ul className="mt-2 space-y-1.5">
            {passwordRules.map((rule) => {
              const met = rule.test(password)
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs sm:text-[0.8125rem] ${met ? 'text-emerald-700' : 'text-text-secondary'}`}
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
                        className="fi fi-br-check flex text-[0.4375rem] leading-none sm:text-[0.5rem]"
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
          {isSubmitting ? 'Salvando…' : 'Criar senha e continuar'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <button type="button" onClick={() => void leave()} className={mutedLinkClass}>
          <i className="fi fi-rr-sign-out-alt flex" aria-hidden="true" />
          Sair
        </button>
      </div>

      <Modal
        open={notice !== null}
        variant={notice?.variant ?? 'success'}
        title={notice?.title ?? ''}
        description={notice?.description ?? ''}
        buttonLabel={notice?.variant === 'success' ? 'Ir para o painel' : 'Entendi'}
        onClose={closeNotice}
      />
    </AuthCard>
  )
}
