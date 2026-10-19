import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { accounts, sessions, users, verifications } from '@/db/schema'
import { isRole } from '@/domain/enterprise/entities/role'

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
        before: async (newUser) => ({
          data: { ...newUser, role: isRole(newUser.role) ? newUser.role : 'student' },
        }),
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
