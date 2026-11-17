import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const instant = false

export default async function PainelPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')

  if (user.role === 'admin') redirect('/admin')
  if (user.role === 'professor') redirect('/professor')
  redirect('/aluno')
}
