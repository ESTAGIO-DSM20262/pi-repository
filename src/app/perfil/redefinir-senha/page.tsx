import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AccountChangePasswordForm } from '@/components/forms/AccountChangePasswordForm'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Redefinir senha • Acervo Acadêmico' }
export const instant = false

export default async function ChangePasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/login')

  return <AccountChangePasswordForm />
}
