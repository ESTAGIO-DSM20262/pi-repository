import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { ProfileRecord } from '@/presentation/profile/profile-record'
import type { ProfileFormInput } from '@/presentation/profile/validation'
import {
  profileFieldErrorClass,
  profileFieldInputClass,
  profileLabelClass,
  profileReadOnlyInputClass,
} from './profile-styles'

interface AccountFieldsProps {
  profile: ProfileRecord
  register: UseFormRegister<ProfileFormInput>
  errors: FieldErrors<ProfileFormInput>
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className={profileLabelClass}>
      {label}
      <input value={value} readOnly className={profileReadOnlyInputClass} />
    </label>
  )
}

export function AccountFields({ profile, register, errors }: AccountFieldsProps) {
  const isAdmin = profile.role === 'admin'
  const editableClass = (invalid: boolean) =>
    isAdmin ? profileFieldInputClass(invalid) : profileReadOnlyInputClass

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={profileLabelClass}>
        Nome completo
        <input
          readOnly={!isAdmin}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'profile-name-error' : undefined}
          className={editableClass(Boolean(errors.name))}
          {...register('name')}
        />
        {errors.name && (
          <span id="profile-name-error" role="alert" className={profileFieldErrorClass}>
            {errors.name.message}
          </span>
        )}
      </label>
      <label className={profileLabelClass}>
        E-mail
        <input
          type="email"
          readOnly={!isAdmin}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'profile-email-error' : undefined}
          className={editableClass(Boolean(errors.email))}
          {...register('email')}
        />
        {errors.email && (
          <span id="profile-email-error" role="alert" className={profileFieldErrorClass}>
            {errors.email.message}
          </span>
        )}
      </label>
      {profile.role === 'student' && (
        <>
          <ReadOnlyField
            label="Registro Acadêmico (RA)"
            value={profile.registrationNumber ?? 'Não informado'}
          />
          <ReadOnlyField label="Curso" value={profile.course ?? 'Não informado'} />
        </>
      )}
      {profile.role === 'professor' && (
        <ReadOnlyField
          label="Matrícula funcional"
          value={profile.registrationNumber ?? 'Não informada'}
        />
      )}
      {profile.role === 'admin' && (
        <ReadOnlyField label="Tipo de acesso" value="Administrador do sistema" />
      )}
    </div>
  )
}
