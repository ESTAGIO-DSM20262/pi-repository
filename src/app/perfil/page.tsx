import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProfilePage } from '@/components/profile/ProfilePage'
import { db } from '@/db'
import { users } from '@/db/schema'
import { isRole } from '@/domain/enterprise/entities/role'
import { auth } from '@/libs/auth'
import { getSafeSocialProfileUrl } from '@/presentation/profile/social-profile-url'

export const metadata = { title: 'Meu perfil • Acervo Acadêmico' }
export const instant = false

export default async function PerfilPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect('/login')

  const [record] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      registrationNumber: users.registrationNumber,
      course: users.course,
      githubUrl: users.githubUrl,
      linkedinUrl: users.linkedinUrl,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, String(session.user.id)))
    .limit(1)

  if (!record?.active || !isRole(record.role)) redirect('/login')

  return (
    <ProfilePage
      initialProfile={{
        ...record,
        githubUrl: getSafeSocialProfileUrl(record.githubUrl, 'github'),
        linkedinUrl: getSafeSocialProfileUrl(record.linkedinUrl, 'linkedin'),
      }}
    />
  )
}
