'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { changePassword } from '@/presentation/profile/change-password'
import { type ChangePasswordValues, changePasswordSchema } from '@/presentation/profile/validation'
import FormFeedback from './FormFeedback'
import { profileFieldErrorClass, profileFieldInputClass, profileLabelClass } from './profile-styles'
import SubmitButton from './SubmitButton'

const DEFAULT_ERROR = 'Não foi possível redefinir a senha. Tente novamente.'

const EMPTY_VALUES: ChangePasswordValues = { currentPassword: '', newPassword: '', confirm: '' }

interface PasswordFieldConfig {
  name: keyof ChangePasswordValues
  label: string
  autoComplete: string
  className?: string
}

const FIELDS: PasswordFieldConfig[] = [
  {
    name: 'currentPassword',
    label: 'Senha atual',
    autoComplete: 'current-password',
    className: 'sm:col-span-2 sm:max-w-sm',
  },
  { name: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' },
  { name: 'confirm', label: 'Confirmar nova senha', autoComplete: 'new-password' },
]

export default function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_VALUES,
  })

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      const result = await changePassword({ currentPassword, newPassword })
      if (!result.ok) {
        setError('root.server', { message: result.error })
        return
      }
      reset(EMPTY_VALUES, { keepIsSubmitSuccessful: true })
    } catch {
      setError('root.server', { message: DEFAULT_ERROR })
    }
  })

  const serverError = errors.root?.server?.message

  return (
    <form onSubmit={onSubmit} className="border-t border-border-light p-5 sm:p-7" noValidate>
      <h3 className="text-sm font-bold text-slate-900">Redefinição de senha</h3>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary">
        Para alterar sua senha, informe a senha atual e a nova senha. Se não deseja alterá-la, deixe
        os campos em branco. A nova senha deve ter no mínimo 8 caracteres, com letras maiúsculas e
        minúsculas e ao menos um número ou símbolo.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const error = errors[field.name]?.message
          const errorId = `${field.name}-error`
          return (
            <label
              key={field.name}
              className={
                field.className ? `${profileLabelClass} ${field.className}` : profileLabelClass
              }
            >
              {field.label}
              <input
                type="password"
                autoComplete={field.autoComplete}
                placeholder="********"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={profileFieldInputClass(Boolean(error))}
                {...register(field.name)}
              />
              {error && (
                <span id={errorId} role="alert" className={profileFieldErrorClass}>
                  {error}
                </span>
              )}
            </label>
          )
        })}
      </div>

      <FormFeedback
        error={serverError}
        success={isSubmitSuccessful && !serverError ? 'Senha redefinida com sucesso.' : undefined}
      />

      <SubmitButton loading={isSubmitting} label="Redefinir senha" loadingLabel="Redefinindo…" />
    </form>
  )
}
