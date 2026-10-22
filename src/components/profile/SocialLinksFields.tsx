import type { ReactNode } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { ProfileFormInput } from '@/presentation/profile/validation'
import { profileFieldErrorClass, profileFieldInputClass, profileLabelClass } from './profile-styles'
import { GitHubBrandIcon, LinkedInBrandIcon } from './SocialBrandIcons'

interface SocialLinksFieldsProps {
  register: UseFormRegister<ProfileFormInput>
  errors: FieldErrors<ProfileFormInput>
}

interface SocialFieldProps extends SocialLinksFieldsProps {
  name: 'githubUrl' | 'linkedinUrl'
  label: string
  icon: ReactNode
  placeholder: string
  errorId: string
}

function SocialField({
  name,
  label,
  icon,
  placeholder,
  errorId,
  register,
  errors,
}: SocialFieldProps) {
  const error = errors[name]?.message

  return (
    <label className={profileLabelClass}>
      <span className="flex items-center gap-2">
        {icon} {label}
      </span>
      <input
        type="text"
        inputMode="url"
        autoComplete="url"
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={profileFieldInputClass(Boolean(error))}
        {...register(name)}
      />
      {error && (
        <span id={errorId} role="alert" className={profileFieldErrorClass}>
          {error}
        </span>
      )}
    </label>
  )
}

export default function SocialLinksFields({ register, errors }: SocialLinksFieldsProps) {
  return (
    <div className="mt-8 border-t border-border-light pt-6">
      <h3 className="text-sm font-bold text-slate-900">Perfis profissionais</h3>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary">
        Adicione links HTTPS dos seus perfis oficiais do GitHub e do LinkedIn. Eles aparecerão ao
        lado do seu nome nos projetos em que você participa ou orienta; links fora dos domínios
        oficiais ou que não sejam perfis pessoais serão recusados.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SocialField
          name="githubUrl"
          label="GitHub"
          icon={<GitHubBrandIcon />}
          placeholder="https://github.com/seu-usuario"
          errorId="github-url-error"
          register={register}
          errors={errors}
        />
        <SocialField
          name="linkedinUrl"
          label="LinkedIn"
          icon={<LinkedInBrandIcon />}
          placeholder="https://www.linkedin.com/in/seu-perfil/"
          errorId="linkedin-url-error"
          register={register}
          errors={errors}
        />
      </div>
    </div>
  )
}
