import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import PanelHeader from '@/components/PanelHeader'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Área do professor • Acervo Acadêmico' }

export const instant = false

export default async function ProfessorPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role !== 'professor') redirect('/aluno')

  return <PanelHeader name={user.name} email={user.emailAddress} role={user.role} />
}
