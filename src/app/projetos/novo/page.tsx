import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import ProjectFormPage, { type ProjectPersonOption } from '@/components/projects/ProjectFormPage'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { Role } from '@/domain/enterprise/entities/role'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { auth } from '@/libs/auth'

export const metadata = { title: 'Cadastrar projeto • Acervo Acadêmico' }
export const instant = false

const ROLE_PATH: Record<Role, string> = {
  student: '/aluno',
  professor: '/professor',
  admin: '/admin',
}

export default async function NewProjectPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const user = toDomainUser(session.user)
  if (!user) redirect('/login')
  if (user.role === 'student') redirect(ROLE_PATH.student)

  async function listActive(role: Role): Promise<ProjectPersonOption[]> {
    const rows = await db
      .select({
        email: users.email,
        name: users.name,
        registrationNumber: users.registrationNumber,
        course: users.course,
      })
      .from(users)
      .where(and(eq(users.role, role), eq(users.active, true)))
      .orderBy(asc(users.name))
    return rows.map((row) => ({
      email: row.email.toLowerCase(),
      name: row.name,
      registrationNumber: row.registrationNumber,
      course: row.course,
    }))
  }

  const [students, professors] = await Promise.all([listActive('student'), listActive('professor')])

  return (
    <ProjectFormPage
      mode="create"
      role={user.role}
      currentUserEmail={user.emailAddress.toLowerCase()}
      students={students}
      professors={professors}
      backHref={ROLE_PATH[user.role]}
    />
  )
}
