import { and, eq, inArray, sql } from 'drizzle-orm'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { GetProjectVerificationUseCase } from '@/application/projects/get-project-verification-use-case'
import {
  canManageActivation,
  canManageProgress as canManageProjectProgress,
  canVerifyProject,
  canViewProject,
  isAdvisorOf,
  isMemberOf,
  resolveProjectEditScope,
} from '@/application/projects/project-permissions'
import { ProjectPublicView } from '@/components/projects/ProjectPublicView'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { Project, ProjectTeamMember } from '@/domain/enterprise/entities/project'
import { getProjectAdvisors, isProjectActive } from '@/domain/enterprise/entities/project-advisors'
import type { ProjectVerificationSummary } from '@/domain/enterprise/entities/project-verification'
import { CompositeProjectRepository } from '@/infrastructure/projects/composite-project-repository'
import { DbProjectVerificationRepository } from '@/infrastructure/projects/db-project-verification-repository'
import { MockProjectRepository } from '@/infrastructure/projects/mock-project-repository'
import { auth } from '@/libs/auth'
import { getSafeSocialProfileUrl } from '@/presentation/profile/social-profile-url'

export const instant = false

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

async function findProject(id: string): Promise<Project | null> {
  return new CompositeProjectRepository().findById(id)
}

async function findPublicProject(id: string) {
  const project = await findProject(id)
  return project?.status === 'publicado' && isProjectActive(project) ? project : null
}

async function addRegisteredSocialProfiles(project: Project): Promise<Project> {
  const sourceTeam = project.teamMembers?.length
    ? project.teamMembers
    : (project.publicDetails?.team ?? [])
  const advisorEmails = getProjectAdvisors(project).map((advisor) =>
    advisor.email.trim().toLowerCase(),
  )
  const emails = [
    ...new Set([
      ...advisorEmails,
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
  const team: ProjectTeamMember[] = sourceTeam.map((member) => {
    const email = member.studentEmail?.trim().toLowerCase()
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

  const withProfile = (advisor: Project['advisor']): Project['advisor'] => {
    const profile = profiles.get(advisor.email.trim().toLowerCase())
    const isProfessor = profile?.role === 'professor'
    return {
      ...advisor,
      name: profile?.name ?? advisor.name,
      githubUrl: isProfessor
        ? (getSafeSocialProfileUrl(profile.githubUrl, 'github') ?? undefined)
        : undefined,
      linkedinUrl: isProfessor
        ? (getSafeSocialProfileUrl(profile.linkedinUrl, 'linkedin') ?? undefined)
        : undefined,
    }
  }

  return {
    ...project,
    advisor: withProfile(project.advisor),
    coAdvisors: (project.coAdvisors ?? []).map(withProfile),
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

  const session = await auth.api.getSession({ headers: await headers() })
  const sessionUserId = session?.user?.id ? String(session.user.id) : ''
  const [account] = sessionUserId
    ? await db
        .select({ id: users.id, email: users.email, name: users.name, role: users.role })
        .from(users)
        .where(and(eq(users.id, sessionUserId), eq(users.active, true)))
        .limit(1)
    : []
  const viewer = account
    ? {
        id: account.id,
        email: account.email.trim().toLowerCase(),
        name: account.name,
        role: account.role,
      }
    : null

  if (!canViewProject(foundProject, viewer)) notFound()
  const project = await addRegisteredSocialProfiles(foundProject)

  const isInvolved =
    viewer !== null &&
    (viewer.role === 'admin' || isAdvisorOf(project, viewer) || isMemberOf(project, viewer))
  const isExampleProject = Boolean(await new MockProjectRepository().findById(project.id))
  const canEditProject =
    viewer !== null && !isExampleProject && resolveProjectEditScope(project, viewer) !== null
  const canManageProgress = viewer !== null && canManageProjectProgress(project, viewer)
  const canVerify = viewer !== null && !isExampleProject && canVerifyProject(project, viewer)
  const canManageProjectActivation =
    viewer !== null && !isExampleProject && canManageActivation(viewer)

  let verification: ProjectVerificationSummary | null = null
  if (!isExampleProject && project.status === 'publicado') {
    verification = await new GetProjectVerificationUseCase(
      new DbProjectVerificationRepository(),
    ).execute({ project })
  }

  return (
    <ProjectPublicView
      project={project}
      isAuthenticated={Boolean(session)}
      canManageProgress={canManageProgress}
      showProjectProgress={isInvolved}
      canEditProject={canEditProject}
      canVerify={canVerify}
      canManageActivation={canManageProjectActivation}
      verification={verification}
      viewerEmail={viewer?.email ?? null}
    />
  )
}
