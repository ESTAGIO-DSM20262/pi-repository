import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import PanelHeader from '@/components/PanelHeader'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Área do aluno • Acervo Acadêmico' }

// Lê a sessão no servidor para autorizar — bloqueia a rota.
export const instant = false

export default async function AlunoPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  // O papel é derivado do domínio do e-mail (não do valor persistido).
  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role !== 'student') redirect('/professor')

  return <PanelHeader name={user.name} email={user.emailAddress} role={user.role} />
}
