import { authClient } from '@/infrastructure/auth/auth-client'

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: string }

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: 'A senha atual está incorreta.',
  CREDENTIAL_ACCOUNT_NOT_FOUND:
    'Sua conta usa login pela Microsoft e não possui senha para ser alterada.',
  PASSWORD_TOO_SHORT: 'A nova senha é muito curta.',
  PASSWORD_TOO_LONG: 'A nova senha é muito longa.',
}

const DEFAULT_ERROR = 'Não foi possível redefinir a senha. Tente novamente.'

export async function changePassword({
  currentPassword,
  newPassword,
}: ChangePasswordInput): Promise<ChangePasswordResult> {
  const { error } = await authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  })

  if (error) {
    return { ok: false, error: ERROR_MESSAGES[error.code ?? ''] ?? DEFAULT_ERROR }
  }

  return { ok: true }
}
