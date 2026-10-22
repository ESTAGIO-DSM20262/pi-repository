import { and, asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import ProjectFormPage, {
  type ProjectFormInitialValues,
  type ProjectPersonOption,
} from '@/components/projects/ProjectFormPage'
import { db } from '@/db'
import { users } from '@/db/schema'
import { splitProjectLinks } from '@/domain/enterprise/entities/project-details'
import type { Role } from '@/domain/enterprise/entities/role'
import { auth } from '@/libs/auth'
import { resolveProjectEditAccess } from '@/libs/project-edit-access'

export const metadata = { title: 'Editar projeto • Acervo Acadêmico' }
export const instant = false

interface EditProjectPageProps {
  params: Promise<{ id: string }>
}

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

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const sessionUserId = session?.user?.id ? String(session.user.id) : ''
  if (!sessionUserId) redirect('/login')

  const access = await resolveProjectEditAccess({ sessionUserId, projectId: id })
  if (!access.ok) {
    if (access.status === 401) redirect('/login')
    if (access.status === 403) redirect(`/projetos/${encodeURIComponent(id)}`)
    notFound()
  }

  const { project, scope, user } = access
  const [activeStudents, professors] = await Promise.all([
    listActive('student'),
    listActive('professor'),
  ])
  const links = splitProjectLinks(project.publicDetails?.externalLinks)
  const sourceTeam = project.teamMembers?.length
    ? project.teamMembers
    : (project.publicDetails?.team ?? [])
  const editableTeam = sourceTeam.map((member, index) => ({
    ...member,
    studentEmail: (member.studentEmail ?? project.memberEmails[index])?.trim().toLowerCase(),
  }))

  const initialValues: ProjectFormInitialValues = {
    title: project.title,
    summary: project.summary,
    overview: project.publicDetails?.overview ?? '',
    cycle: project.cycle,
    semester: project.semester,
    theme: project.theme,
    status: project.status,
    advisorEmail: project.advisorEmail.toLowerCase(),
    languages: project.languages,
    stack: project.stack,
    studentEmails: project.memberEmails.map((email) => email.trim().toLowerCase()),
    teamMembers: editableTeam,
    repositoryUrl: links.repositoryUrl ?? '',
    liveUrl: links.liveUrl ?? '',
    prototypeUrl: links.prototypeUrl ?? '',
    extraLinks: links.extraLinks,
  }

  const advisorListed = professors.some(
    (professor) => professor.email === initialValues.advisorEmail,
  )
  const knownProfessors = advisorListed
    ? professors
    : [
        ...professors,
        {
          email: initialValues.advisorEmail,
          name: project.advisorName,
          registrationNumber: null,
          course: null,
        },
      ]

  const knownEmails = new Set(activeStudents.map((student) => student.email))
  const formerMembers: ProjectPersonOption[] = editableTeam
    .filter((member) => member.studentEmail && !knownEmails.has(member.studentEmail.toLowerCase()))
    .map((member) => ({
      email: (member.studentEmail ?? '').toLowerCase(),
      name: member.name,
      registrationNumber: null,
      course: null,
    }))
  const students = [...activeStudents, ...formerMembers]

  return (
    <ProjectFormPage
      mode="edit"
      scope={scope}
      role={user.role}
      currentUserEmail={user.email}
      students={students}
      professors={knownProfessors}
      backHref={`/projetos/${encodeURIComponent(project.id)}`}
      projectId={project.id}
      initialValues={initialValues}
    />
  )
}
