import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import PanelHeader from '@/components/PanelHeader'
import { auth } from '@/libs/auth'
import { normalizeRole } from '@/libs/institutional-email'

export const metadata = { title: 'Área do professor • Acervo Acadêmico' }

// Lê a sessão no servidor para autorizar — bloqueia a rota.
export const instant = false

export default async function ProfessorPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const role = normalizeRole(session.user.role)
  if (role !== 'professor') redirect('/aluno')

  return <PanelHeader name={session.user.name} email={session.user.email} role={role} />
}
