import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/libs/auth'

// Lê a sessão no servidor para redirecionar por papel — bloqueia a rota.
export const instant = false

// Dispatcher: autentica e encaminha para a área conforme o papel.
export default async function PainelPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  redirect(session.user.role === 'professor' ? '/professor' : '/aluno')
}
