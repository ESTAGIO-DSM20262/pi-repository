'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { ProfileRecord } from '@/presentation/profile/profile-record'
import {
  createProfileSchema,
  type ProfileFormInput,
  type ProfileFormOutput,
  toProfileFormValues,
} from '@/presentation/profile/validation'
import { AccountFields } from './AccountFields'
import { FormFeedback } from './FormFeedback'
import { SocialLinksFields } from './SocialLinksFields'
import { SubmitButton } from './SubmitButton'

const DEFAULT_ERROR = 'Não foi possível salvar o perfil.'

async function readError(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  return payload.error ?? 'Não foi possível salvar as alterações.'
}

interface ProfileFormProps {
  profile: ProfileRecord
  onSaved: (profile: ProfileRecord) => void
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const isAdmin = profile.role === 'admin'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(createProfileSchema(isAdmin)),
    mode: 'onTouched',
    defaultValues: toProfileFormValues(profile),
  })

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(isAdmin ? { name: values.name, email: values.email } : {}),
            githubUrl: values.githubUrl,
            linkedinUrl: values.linkedinUrl,
          }),
        })
        if (!response.ok) throw new Error(await readError(response))
        const payload = (await response.json()) as { profile: ProfileRecord }
        reset(toProfileFormValues(payload.profile), { keepIsSubmitSuccessful: true })
        onSaved(payload.profile)
      } catch (saveError) {
        setError('root.server', {
          message: saveError instanceof Error ? saveError.message : DEFAULT_ERROR,
        })
      }
    },
    (fieldErrors) => {
      if (fieldErrors.githubUrl || fieldErrors.linkedinUrl) {
        setError('root.server', {
          message:
            'Corrija os links inválidos antes de salvar. Informe apenas URLs HTTPS de perfis oficiais.',
        })
      }
    },
  )

  const serverError = errors.root?.server?.message

  return (
    <form onSubmit={onSubmit} className="p-5 sm:p-7" noValidate>
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900">Dados da conta</h3>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          {isAdmin
            ? 'Como administrador, você pode atualizar seu nome, e-mail e perfis profissionais.'
            : 'Nome, e-mail e dados acadêmicos são gerenciados pela administração. Você pode atualizar apenas seus perfis profissionais.'}
        </p>
      </div>

      <AccountFields profile={profile} register={register} errors={errors} />
      <SocialLinksFields register={register} errors={errors} />

      <FormFeedback
        error={serverError}
        success={isSubmitSuccessful && !serverError ? 'Perfil atualizado com sucesso.' : undefined}
      />

      <SubmitButton
        loading={isSubmitting}
        label={isAdmin ? 'Salvar alterações' : 'Salvar perfis profissionais'}
        loadingLabel="Salvando…"
      />
    </form>
  )
}
