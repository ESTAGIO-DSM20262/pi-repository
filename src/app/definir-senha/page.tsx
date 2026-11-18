import { eq } from 'drizzle-orm'
import { InvalidInviteLink } from '@/components/forms/InvalidInviteLink'
import { ResetPasswordFields } from '@/components/forms/ResetPasswordForm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { inviteTokenIdentifier } from '@/libs/account-invite'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Defina sua senha • Acervo Acadêmico' }
export const instant = false

async function findInviteAccount(token: string) {
  const context = await auth.$context
  const verification = await context.internalAdapter.findVerificationValue(
    inviteTokenIdentifier(token),
  )
  if (!verification || verification.expiresAt.getTime() <= Date.now()) return null

  const [account] = await db
    .select({ name: users.name, email: users.email, active: users.active })
    .from(users)
    .where(eq(users.id, verification.value))
    .limit(1)
  if (!account || account.active === false) return null

  return { name: account.name, email: account.email }
}

export default async function InvitePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  const value = Array.isArray(token) ? token[0] : token
  const account = value ? await findInviteAccount(value).catch(() => null) : null

  if (!value || !account) return <InvalidInviteLink />

  return <ResetPasswordFields token={value} invite={account} />
}
