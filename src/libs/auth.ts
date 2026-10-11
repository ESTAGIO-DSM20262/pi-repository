import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import { accounts, sessions, users, verifications } from '@/db/schema'
import { roleFromEmail } from '@/libs/institutional-email'

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET

const socialProviders =
  microsoftClientId && microsoftClientSecret
    ? {
        microsoft: {
          clientId: microsoftClientId,
          clientSecret: microsoftClientSecret,
          // Multi-tenant: aceita qualquer tenant corporativo/escolar (contas
          // pessoais da Microsoft ficam de fora). O domínio do e-mail é
          // validado no create hook abaixo.
          tenantId: process.env.MICROSOFT_TENANT_ID ?? 'organizations',
          prompt: 'select_account' as const,
          // O Entra ID frequentemente não envia o claim `email`; nesse caso o
          // UPN (`preferred_username`) é usado como e-mail institucional.
          mapProfileToUser: (profile: { email?: string; preferred_username?: string }) => ({
            email: (profile.email ?? profile.preferred_username ?? '').toLowerCase(),
          }),
        },
      }
    : undefined

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),

  // Contas são pré-provisionadas (seed/admin). Não há autocadastro.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },

  socialProviders,

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['microsoft'],
    },
  },

  user: {
    additionalFields: {
      role: {
        type: ['aluno', 'professor'],
        // Preenchido no databaseHook `user.create.before` (derivado do domínio).
        // Não pode ser `required: true`: o parser do OAuth rejeita o create
        // antes do hook rodar quando o campo é obrigatório e `input: false`.
        required: false,
        input: false,
      },
    },
  },

  // Fonte única de verdade para o papel: derivado do domínio do e-mail.
  // Rejeita qualquer conta (seed, OAuth ou e-mail/senha) fora dos domínios.
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const role = roleFromEmail(String(newUser.email ?? ''))
          if (!role) {
            throw new APIError('BAD_REQUEST', {
              code: 'INVALID_INSTITUTIONAL_EMAIL',
              message: 'E-mail institucional inválido. Use aluno.cps.sp.gov.br ou cps.sp.gov.br.',
            })
          }
          return { data: { ...newUser, role } }
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email = (ctx.body as { email?: unknown } | undefined)?.email
        if (typeof email === 'string' && !roleFromEmail(email)) {
          throw new APIError('BAD_REQUEST', {
            code: 'INVALID_INSTITUTIONAL_EMAIL',
            message: 'E-mail institucional inválido. Use aluno.cps.sp.gov.br ou cps.sp.gov.br.',
          })
        }
      }
    }),
  },

  // Deve ser o último plugin: sincroniza o cookie de sessão com o Next.
  plugins: [nextCookies()],
})
