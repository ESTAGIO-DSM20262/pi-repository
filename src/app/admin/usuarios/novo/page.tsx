import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { UserRegistrationPage } from '@/components/admin/UserRegistrationPage'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Cadastro de usuários • Acervo Acadêmico' }
export const instant = false

export default async function NewAdminUserPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect(ROLE_DASHBOARD_PATH[user.role])

  return <UserRegistrationPage />
}
