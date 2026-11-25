export interface LoginErrorNotice {
  variant: 'error' | 'warning'
  title: string
  description: string
}

const NOT_REGISTERED_NOTICE: LoginErrorNotice = {
  variant: 'warning',
  title: 'Conta não cadastrada',
  description:
    'Você não tem uma conta cadastrada no Acervo Acadêmico. Procure a secretaria da Fatec e peça o seu cadastro para poder entrar com a Microsoft.',
}

const DISABLED_NOTICE: LoginErrorNotice = {
  variant: 'error',
  title: 'Conta desativada',
  description: 'Esta conta está desativada. Entre em contato com a secretaria da Fatec.',
}

const LOGIN_ERROR_NOTICES: Record<string, LoginErrorNotice> = {
  signup_disabled: NOT_REGISTERED_NOTICE,
  SIGNUP_DISABLED: NOT_REGISTERED_NOTICE,
  unable_to_create_user: NOT_REGISTERED_NOTICE,
  USER_DISABLED: DISABLED_NOTICE,
  unable_to_create_session: DISABLED_NOTICE,
}

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: 'O endereço de e-mail informado é inválido.',
  email_not_found: 'Não foi possível obter um endereço de e-mail da sua conta Microsoft.',
  email_not_verified:
    'O e-mail da sua conta Microsoft não foi verificado. Procure a coordenação do curso.',
  account_not_linked:
    'Não foi possível vincular esta conta Microsoft à sua conta do Acervo. Procure a secretaria da Fatec.',
  state_not_found: 'A sessão de login expirou antes da conclusão. Tente novamente.',
  state_mismatch: 'A sessão de login expirou antes da conclusão. Tente novamente.',
  please_restart_the_process: 'A sessão de login expirou antes da conclusão. Tente novamente.',
  access_denied: 'A autenticação foi cancelada. Tente novamente.',
  invalid_code: 'A autenticação foi cancelada ou expirou. Tente novamente.',
  unable_to_get_user_info: 'Não foi possível ler os dados da sua conta Microsoft. Tente novamente.',
}

const FALLBACK_MESSAGE =
  'Não foi possível entrar com a Microsoft. Verifique a conta selecionada e tente novamente.'

export function resolveLoginErrorNotice(code: string): LoginErrorNotice {
  const notice = Object.hasOwn(LOGIN_ERROR_NOTICES, code) ? LOGIN_ERROR_NOTICES[code] : undefined
  if (notice) return notice

  return {
    variant: 'error',
    title: 'Falha ao entrar',
    description: Object.hasOwn(LOGIN_ERROR_MESSAGES, code)
      ? LOGIN_ERROR_MESSAGES[code]
      : FALLBACK_MESSAGE,
  }
}
