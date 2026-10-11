import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import { accounts, sessions, users, verifications } from '@/db/schema'
import { InstitutionalEmail } from '@/domain/enterprise/entities/institutional-email'

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET

const socialProviders =
  microsoftClientId && microsoftClientSecret
    ? {
        microsoft: {
          clientId: microsoftClientId,
          clientSecret: microsoftClientSecret,
          tenantId: process.env.MICROSOFT_TENANT_ID ?? 'organizations',
          prompt: 'select_account' as const,
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
        type: ['student', 'professor'],
        required: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const email = InstitutionalEmail.create(String(newUser.email ?? ''))
          if (email.isLeft()) {
            throw new APIError('BAD_REQUEST', {
              code: 'INVALID_INSTITUTIONAL_EMAIL',
              message:
                'E-mail institucional inválido. Use o e-mail institucional cadastrado na instituição.',
            })
          }
          return { data: { ...newUser, role: email.value.role } }
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email = (ctx.body as { email?: unknown } | undefined)?.email
        if (typeof email === 'string' && !InstitutionalEmail.isValid(email)) {
          throw new APIError('BAD_REQUEST', {
            code: 'INVALID_INSTITUTIONAL_EMAIL',
            message:
              'E-mail institucional inválido. Use o e-mail institucional cadastrado na instituição.',
          })
        }
      }
    }),
  },

  plugins: [nextCookies()],
})
