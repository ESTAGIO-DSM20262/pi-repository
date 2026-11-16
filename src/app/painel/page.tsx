import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'
import { FIRST_ACCESS_PATH } from '@/presentation/auth/first-access'

export const instant = false

export default async function PainelPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')

  if (user.mustChangePassword) redirect(FIRST_ACCESS_PATH)

  if (user.role === 'admin') redirect('/admin')
  if (user.role === 'professor') redirect('/professor')
  redirect('/aluno')
}
