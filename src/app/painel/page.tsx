import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

// Lê a sessão no servidor para redirecionar por papel — bloqueia a rota.
export const instant = false

// Dispatcher: autentica e encaminha para a área conforme o papel.
export default async function PainelPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  // O papel é derivado do domínio do e-mail (não do valor persistido).
  const user = toDomainUser(session.user)
  if (!user) redirect('/login')

  redirect(user.role === 'professor' ? '/professor' : '/aluno')
}
