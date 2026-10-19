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

const TEST_USERS: SeedUser[] = [
  {
    name: 'João Silva',
    email: 'joao.silva@aluno.cps.sp.gov.br',
    password: 'Aluno@123',
    role: 'student',
  },
  {
    name: 'Prof. Dr. Carlos Oliveira',
    email: 'carlos.pereira@cps.sp.gov.br',
    password: 'Professor@123',
    role: 'professor',
  },
  {
    name: 'Secretaria — Fatec Itaquera',
    email: 'admin.acervo@cps.sp.gov.br',
    password: 'Admin@123',
    role: 'admin',
  },
]

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de usuários de teste não pode ser executado em produção.')
  }

  const ctx = await auth.$context

  for (const account of TEST_USERS) {
    const normalizedEmail = account.email.trim().toLowerCase()
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    const userId = existingUsers[0]?.id ?? randomUUID()
    const now = new Date()

    if (existingUsers.length > 0) {
      await db
        .update(users)
        .set({
          name: account.name,
          email: normalizedEmail,
          emailVerified: true,
          role: account.role,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
    } else {
      await db.insert(users).values({
        id: userId,
        name: account.name,
        email: normalizedEmail,
        emailVerified: true,
        role: account.role,
        createdAt: now,
        updatedAt: now,
      })
    }

    const passwordHash = await ctx.password.hash(account.password)
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

    console.log(`Conta de teste pronta: ${normalizedEmail} (${account.role})`)
  }

  console.log('\nSeed concluído. As senhas de teste estão documentadas em TEST_USERS.md.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falha no seed:', error)
    process.exit(1)
  })
