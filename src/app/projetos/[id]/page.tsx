import { and, eq, inArray, sql } from 'drizzle-orm'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import ProjectPublicView from '@/components/projects/ProjectPublicView'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { Project, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import { DbProjectRepository } from '@/infrastructure/projects/db-project-repository'
import { auth } from '@/libs/auth'
import { resolveProjectEditAccess } from '@/libs/project-edit-access'
import { getSafeSocialProfileUrl } from '@/presentation/profile/social-profile-url'

export const instant = false

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

async function findProject(id: string): Promise<Project | null> {
  return new DbProjectRepository().findById(id)
}

async function findPublicProject(id: string) {
  const project = await findProject(id)
  return project?.status === 'publicado' ? project : null
}

async function addRegisteredSocialProfiles(project: Project): Promise<Project> {
  const sourceTeam = project.teamMembers?.length
    ? project.teamMembers
    : (project.publicDetails?.team ?? [])
  const emails = [
    ...new Set([
      project.advisor.email.trim().toLowerCase(),
      ...project.memberEmails.map((email) => email.trim().toLowerCase()),
      ...sourceTeam
        .map((member) => member.studentEmail?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ]),
  ]

  const records = await db
    .select({
      email: users.email,
      name: users.name,
      role: users.role,
      githubUrl: users.githubUrl,
      linkedinUrl: users.linkedinUrl,
    })
    .from(users)
    .where(inArray(sql<string>`lower(${users.email})`, emails))

  const profiles = new Map(records.map((record) => [record.email.trim().toLowerCase(), record]))
  const advisorProfile = profiles.get(project.advisor.email.trim().toLowerCase())
  const team: ProjectTeamMember[] = sourceTeam.map((member, index) => {
    const email = (member.studentEmail ?? project.memberEmails[index])?.trim().toLowerCase()
    const registered = email ? profiles.get(email) : undefined
    return {
      ...member,
      studentEmail: member.studentEmail ?? email,
      name: registered?.name ?? member.name,
      githubUrl:
        registered?.role === 'student'
          ? (getSafeSocialProfileUrl(registered.githubUrl, 'github') ?? undefined)
          : undefined,
      linkedinUrl:
        registered?.role === 'student'
          ? (getSafeSocialProfileUrl(registered.linkedinUrl, 'linkedin') ?? undefined)
          : undefined,
    }
  })

  return {
    ...project,
    advisor: {
      ...project.advisor,
      name: advisorProfile?.name ?? project.advisor.name,
      githubUrl:
        advisorProfile?.role === 'professor'
          ? (getSafeSocialProfileUrl(advisorProfile.githubUrl, 'github') ?? undefined)
          : undefined,
      linkedinUrl:
        advisorProfile?.role === 'professor'
          ? (getSafeSocialProfileUrl(advisorProfile.linkedinUrl, 'linkedin') ?? undefined)
          : undefined,
    },
    teamMembers: team,
    publicDetails: project.publicDetails
      ? { ...project.publicDetails, team }
      : project.publicDetails,
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await findPublicProject(id)

  if (!project) return { title: 'Projeto | Acervo Acadêmico' }

  return {
    title: `${project.title} | Acervo Acadêmico`,
    description: project.summary,
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const foundProject = await findProject(id)
  if (!foundProject) notFound()
  const project = await addRegisteredSocialProfiles(foundProject)

  const session = await auth.api.getSession({ headers: await headers() })
  const sessionUserId = session?.user?.id ? String(session.user.id) : ''
  let showProjectProgress = false
  let canManageProgress = false
  let canEditProject = false

  if (sessionUserId) {
    const [account] = await db
      .select({ email: users.email, role: users.role, active: users.active })
      .from(users)
      .where(and(eq(users.id, sessionUserId), eq(users.active, true)))
      .limit(1)

    if (account) {
      const email = account.email.trim().toLowerCase()
      const advisorEmail = project.advisor.email.trim().toLowerCase()
      const isAdmin = account.role === 'admin'
      const isAdvisor = account.role === 'professor' && advisorEmail === email
      const isMember =
        account.role === 'student' &&
        project.memberEmails.some((memberEmail) => memberEmail.trim().toLowerCase() === email)
      const isInvolved = isAdmin || isAdvisor || isMember

      if (project.status === 'em_andamento' && !isInvolved) notFound()

      showProjectProgress = isInvolved
      canManageProgress = project.status === 'em_andamento' && (isAdmin || isAdvisor)

      if (isAdmin || isAdvisor) {
        const editAccess = await resolveProjectEditAccess({
          sessionUserId,
          projectId: project.id,
        }).catch(() => null)
        canEditProject = Boolean(editAccess?.ok)
      }
    }
  }

  if (project.status === 'em_andamento' && !showProjectProgress) notFound()

  return (
    <ProjectPublicView
      project={project}
      isAuthenticated={Boolean(session)}
      canManageProgress={canManageProgress}
      showProjectProgress={showProjectProgress}
      canEditProject={canEditProject}
    />
  )
}
