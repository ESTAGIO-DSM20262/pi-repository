import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProjectBulkImportPage } from '@/components/projects/ProjectBulkImportPage'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'

export const metadata = { title: 'Cadastro de projetos em massa • Acervo Acadêmico' }
export const instant = false

export default async function BulkProjectImportPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role === 'student') redirect(ROLE_DASHBOARD_PATH.student)

  return <ProjectBulkImportPage role={user.role} backHref={ROLE_DASHBOARD_PATH[user.role]} />
}
