import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { FirstAccessForm } from '@/components/forms/FirstAccessForm'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Primeiro acesso • Acervo Acadêmico' }
export const instant = false

export default async function FirstAccessPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (!user.mustChangePassword) redirect('/painel')

  return <FirstAccessForm name={user.name} />
}
