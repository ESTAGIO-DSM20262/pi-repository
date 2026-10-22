import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { accounts, users } from '@/db/schema'
import type { Role } from '@/domain/enterprise/entities/role'
import { auth } from '@/libs/auth'

interface SeedUser {
  name: string
  email: string
  password: string
  role: Role
}

/**
 * Contas fictícias para desenvolvimento local.
 * Não execute este seed em produção.
 */
const TEST_USERS: SeedUser[] = [
  {
    name: 'João Silva',
    email: 'joao@gmail.com',
    password: 'Aluno@123',
    role: 'student',
  },
  {
    name: 'Carlos Pereira',
    email: 'carlos@gmail.com',
    password: 'Professor@123',
    role: 'professor',
  },
  {
    name: 'Secretaria',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
  },
]

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de usuários de teste não pode ser executado em produção.')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está configurada no arquivo .env.')
  }

  const ctx = await auth.$context

  for (const testUser of TEST_USERS) {
    const email = testUser.email.trim().toLowerCase()
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const userId = existingUsers[0]?.id ?? randomUUID()
    const now = new Date()

    if (existingUsers.length > 0) {
      await db
        .update(users)
        .set({
          name: testUser.name,
          email,
          emailVerified: true,
          role: testUser.role,
          active: true,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
    } else {
      await db.insert(users).values({
        id: userId,
        name: testUser.name,
        email,
        emailVerified: true,
        image: null,
        role: testUser.role,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    const passwordHash = await ctx.password.hash(testUser.password)
    const existingCredentialAccounts = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
      .limit(1)

    if (existingCredentialAccounts.length > 0) {
      await db
        .update(accounts)
        .set({
          accountId: userId,
          password: passwordHash,
          updatedAt: now,
        })
        .where(eq(accounts.id, existingCredentialAccounts[0].id))
    } else {
      await db.insert(accounts).values({
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      })
    }

    console.log(`Conta de teste pronta: ${email} (${testUser.role})`)
  }

  console.log('\nSeed concluído. As contas de teste foram criadas ou atualizadas.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falha no seed:', error)
    process.exit(1)
  })
