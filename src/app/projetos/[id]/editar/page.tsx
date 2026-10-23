import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import {
  type ProjectFormInitialValues,
  ProjectFormPage,
} from '@/components/projects/ProjectFormPage'
import { splitProjectLinks } from '@/domain/enterprise/entities/project-details'
import { listActiveProjectPeople } from '@/infrastructure/projects/list-active-project-people'
import { auth } from '@/libs/auth'
import { resolveProjectEditAccess } from '@/libs/project-edit-access'
import type { ProjectPersonOption } from '@/presentation/projects/project-person'

export const metadata = { title: 'Editar projeto • Acervo Acadêmico' }
export const instant = false

interface EditProjectPageProps {
  params: Promise<{ id: string }>
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
    listActiveProjectPeople('student'),
    listActiveProjectPeople('professor'),
  ])
  const links = splitProjectLinks(project.publicDetails?.externalLinks)
  const sourceTeam = project.teamMembers?.length
    ? project.teamMembers
    : (project.publicDetails?.team ?? [])
  const editableTeam = sourceTeam.map((member) => ({
    ...member,
    studentEmail: member.studentEmail?.trim().toLowerCase(),
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
