import 'dotenv/config'
import { InstitutionalEmail } from '@/domain/enterprise/entities/institutional-email'
import { auth } from '@/libs/auth'

// Contas pré-provisionadas. Ajuste livremente antes de rodar `npm run db:seed`.
// O papel (student/professor) é sempre derivado do domínio do e-mail.
interface SeedUser {
  name: string
  email: string
  password?: string
}

const USERS: SeedUser[] = [
  { name: 'João Silva', email: 'joao.silva@aluno.cps.sp.gov.br', password: 'Trocar@123' },
  { name: 'Maria Souza', email: 'maria.souza@aluno.cps.sp.gov.br', password: 'Trocar@123' },
  { name: 'Carlos Pereira', email: 'carlos.pereira@cps.sp.gov.br', password: 'Trocar@123' },
  { name: 'Ana Lima', email: 'ana.lima@cps.sp.gov.br', password: 'Trocar@123' },
]

async function main() {
  const ctx = await auth.$context

  for (const account of USERS) {
    const email = InstitutionalEmail.create(account.email)
    if (email.isLeft()) {
      console.warn(`Ignorado (domínio inválido): ${account.email}`)
      continue
    }

    const role = email.value.role

    const existing = await ctx.internalAdapter.findUserByEmail(account.email)
    if (existing) {
      console.log(`Já existe: ${account.email} (${role})`)
      continue
    }

    const created = await ctx.internalAdapter.createUser(
      {
        name: account.name,
        email: account.email,
        emailVerified: true,
      },
      { method: 'admin' },
    )

    if (account.password) {
      await ctx.internalAdapter.createAccount({
        userId: created.id,
        providerId: 'credential',
        accountId: created.id,
        password: await ctx.password.hash(account.password),
      })
    }

    console.log(`Criado: ${account.email} (${created.role ?? role})`)
  }

  console.log('\nSeed concluído.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falha no seed:', error)
    process.exit(1)
  })
