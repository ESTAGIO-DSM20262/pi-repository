export const ACCOUNT_INVITE_VALIDITY_DAYS = 7

export const ACCOUNT_INVITE_TTL_MS = ACCOUNT_INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000

export const INVITE_PATH = '/definir-senha'

// Mesmo identificador que o better-auth usa nos tokens de redefinição de senha: o convite é um
// token de redefinição com validade maior, então `resetPassword` o aceita sem nenhum código extra.
export function inviteTokenIdentifier(token: string) {
  return `reset-password:${token}`
}

export function buildInviteUrl(appUrl: string, token: string) {
  return `${appUrl.replace(/\/+$/, '')}${INVITE_PATH}?token=${encodeURIComponent(token)}`
}
