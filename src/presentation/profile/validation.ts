import { z } from 'zod'
import {
  confirmPasswordSchema,
  emailSchema,
  newPasswordSchema,
} from '@/presentation/auth/validation'
import type { ProfileRecord } from './profile-record'
import { type SocialNetwork, validateSocialProfileUrl } from './social-profile-url'

export function socialProfileUrlSchema(network: SocialNetwork) {
  return z.string().transform((value, context) => {
    const result = validateSocialProfileUrl(value, network)
    if (!result.valid) {
      context.addIssue({ code: 'custom', message: result.error })
      return z.NEVER
    }
    return result.value
  })
}

const adminNameSchema = z
  .string()
  .trim()
  .min(3, 'O nome deve ter entre 3 e 160 caracteres.')
  .max(160, 'O nome deve ter entre 3 e 160 caracteres.')

const adminEmailSchema = emailSchema
  .refine((value) => value.length <= 254, 'Informe um endereço de e-mail válido.')
  .transform((value) => value.toLowerCase())

export function createProfileSchema(isAdmin: boolean) {
  return z.object({
    name: isAdmin ? adminNameSchema : z.string(),
    email: isAdmin ? adminEmailSchema : z.string(),
    githubUrl: socialProfileUrlSchema('github'),
    linkedinUrl: socialProfileUrlSchema('linkedin'),
  })
}

export type ProfileFormSchema = ReturnType<typeof createProfileSchema>
export type ProfileFormInput = z.input<ProfileFormSchema>
export type ProfileFormOutput = z.output<ProfileFormSchema>

export function toProfileFormValues(profile: ProfileRecord): ProfileFormInput {
  return {
    name: profile.name,
    email: profile.email,
    githubUrl: profile.githubUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
  }
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: newPasswordSchema,
    confirm: confirmPasswordSchema,
  })
  .refine((data) => data.newPassword === data.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem.',
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
