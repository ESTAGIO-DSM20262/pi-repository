import { z } from 'zod'

const EMAIL_REQUIRED_MESSAGE = 'Informe seu e-mail.'
const EMAIL_FORMAT_MESSAGE = 'Digite um e-mail válido.'
const PASSWORD_REQUIRED_MESSAGE = 'Informe sua senha.'

export const LOGIN_EMAIL_ERROR_MESSAGES = [EMAIL_REQUIRED_MESSAGE, EMAIL_FORMAT_MESSAGE] as const
export const LOGIN_PASSWORD_ERROR_MESSAGES = [PASSWORD_REQUIRED_MESSAGE] as const

const emailFormat = z.email(EMAIL_FORMAT_MESSAGE)

export const emailSchema = z
  .string()
  .trim()
  .min(1, EMAIL_REQUIRED_MESSAGE)
  .refine((value) => emailFormat.safeParse(value).success, EMAIL_FORMAT_MESSAGE)

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, PASSWORD_REQUIRED_MESSAGE),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const passwordRules: ReadonlyArray<{ label: string; test: (password: string) => boolean }> =
  [
    { label: 'Mínimo de 8 caracteres', test: (password) => password.length >= 8 },
    {
      label: 'Letra maiúscula e minúscula',
      test: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      label: 'Pelo menos um número ou caractere especial',
      test: (password) => /[\d\W_]/.test(password),
    },
  ]

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Informe a nova senha.')
      .refine((value) => value.length >= 8, 'A senha deve ter no mínimo 8 caracteres.')
      .refine(
        (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
        'A senha deve conter letras maiúsculas e minúsculas.',
      )
      .refine(
        (value) => /[\d\W_]/.test(value),
        'A senha deve conter ao menos um número ou caractere especial.',
      ),
    confirm: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem.',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
