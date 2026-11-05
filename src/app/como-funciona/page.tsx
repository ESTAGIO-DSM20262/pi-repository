import { headers } from 'next/headers'
import { HowItWorksPage } from '@/components/how-it-works/HowItWorksPage'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Como funciona | Acervo Acadêmico' }
export const instant = false

export default async function ComoFuncionaPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session ? toDomainUser(session.user) : null

  return <HowItWorksPage role={user?.role ?? null} />
}
