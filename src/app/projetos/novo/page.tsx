import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProjectFormPage } from '@/components/projects/ProjectFormPage'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { listActiveProjectPeople } from '@/infrastructure/projects/list-active-project-people'
import { auth } from '@/libs/auth'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'

export const metadata = { title: 'Cadastrar projeto • Acervo Acadêmico' }
export const instant = false

export default async function NewProjectPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role === 'student') redirect(ROLE_DASHBOARD_PATH.student)

  const [students, professors] = await Promise.all([
    listActiveProjectPeople('student'),
    listActiveProjectPeople('professor'),
  ])

  return (
    <ProjectFormPage
      mode="create"
      role={user.role}
      currentUserEmail={user.emailAddress.toLowerCase()}
      students={students}
      professors={professors}
      backHref={ROLE_DASHBOARD_PATH[user.role]}
    />
  )
}
