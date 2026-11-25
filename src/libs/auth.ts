import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { eq } from 'drizzle-orm'
import { SendPasswordResetEmailUseCase } from '@/application/auth/send-password-reset-email'
import { db } from '@/db'
import { accounts, sessions, users, verifications } from '@/db/schema'
import { makePasswordResetNotifier } from '@/infrastructure/email/make-password-reset-notifier'
import { isMultiTenantAuthority, resolveMicrosoftTenant } from '@/libs/microsoft-tenant'

const sendPasswordResetEmail = new SendPasswordResetEmailUseCase(makePasswordResetNotifier())

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET
const microsoftTenantId = resolveMicrosoftTenant(process.env.MICROSOFT_TENANT_ID)

if (
  microsoftClientId &&
  microsoftClientSecret &&
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PHASE !== 'phase-production-build' &&
  isMultiTenantAuthority(microsoftTenantId)
) {
  console.warn(
    `MICROSOFT_TENANT_ID está como "${microsoftTenantId}": qualquer organização Microsoft pode iniciar o login. Informe o Tenant ID da Fatec para restringir o acesso.`,
  )
}

const socialProviders =
  microsoftClientId && microsoftClientSecret
    ? {
        microsoft: {
          clientId: microsoftClientId,
          clientSecret: microsoftClientSecret,
          tenantId: microsoftTenantId,
          prompt: 'select_account' as const,
          disableSignUp: true,
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

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const result = await sendPasswordResetEmail.execute({
        email: user.email,
        name: user.name,
        active: (user as { active?: boolean | null }).active !== false,
        resetUrl: url,
      })
      if (result.isLeft()) {
        console.error('Falha ao enviar e-mail de redefinição de senha:', result.value.message)
      }
    },
  },

  socialProviders,

  rateLimit: {
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/request-password-reset': { window: 300, max: 5 },
      '/reset-password': { window: 300, max: 10 },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['microsoft'],
    },
  },

  user: {
    additionalFields: {
      role: {
        type: ['student', 'professor', 'admin'],
        required: false,
        input: false,
      },
      registrationNumber: { type: 'string', required: false, input: false },
      course: { type: 'string', required: false, input: false },
      active: { type: 'boolean', required: false, defaultValue: true, input: false },
      githubUrl: { type: 'string', required: false, input: false },
      linkedinUrl: { type: 'string', required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async () => {
          throw new APIError('FORBIDDEN', {
            code: 'SIGNUP_DISABLED',
            message:
              'Não há uma conta cadastrada para este e-mail. Procure a secretaria da Fatec para solicitar o cadastro.',
          })
        },
      },
    },
    session: {
      create: {
        before: async (newSession) => {
          const existingUser = await db
            .select({ active: users.active })
            .from(users)
            .where(eq(users.id, newSession.userId))
            .limit(1)

          if (existingUser[0]?.active === false) {
            throw new APIError('FORBIDDEN', {
              code: 'USER_DISABLED',
              message: 'Esta conta está desativada. Entre em contato com a secretaria da Fatec.',
            })
          }

          return { data: newSession }
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email = (ctx.body as { email?: unknown } | undefined)?.email
        if (typeof email === 'string') {
          const existingUser = await db
            .select({ active: users.active })
            .from(users)
            .where(eq(users.email, email.trim().toLowerCase()))
            .limit(1)

          if (existingUser[0]?.active === false) {
            throw new APIError('FORBIDDEN', {
              code: 'USER_DISABLED',
              message: 'Esta conta está desativada. Entre em contato com a secretaria da Fatec.',
            })
          }
        }
      }
    }),
  },

  plugins: [nextCookies()],
})
