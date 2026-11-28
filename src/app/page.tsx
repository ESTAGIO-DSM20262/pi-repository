import { headers } from 'next/headers'
import { buildCourseSelectOptions } from '@/application/courses/course-rules'
import { ListProjectsUseCase } from '@/application/projects/list-projects'
import { ProjectsExplorer } from '@/components/projects/ProjectsExplorer'
import { toDomainUser } from '@/infrastructure/auth/better-auth-user-mapper'
import { listCourses } from '@/infrastructure/courses/course-queries'
import { CompositeProjectRepository } from '@/infrastructure/projects/composite-project-repository'
import { auth } from '@/libs/auth'

export const instant = false

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session ? toDomainUser(session.user) : null

  const useCase = new ListProjectsUseCase(new CompositeProjectRepository())
  const [{ projects }, courses] = await Promise.all([
    useCase.execute({
      viewer: user ? { email: user.emailAddress, role: user.role } : null,
    }),
    listCourses().catch(() => []),
  ])

  return (
    <ProjectsExplorer
      projects={projects}
      viewerRole={user?.role ?? null}
      isAuthenticated={Boolean(session)}
      courses={buildCourseSelectOptions(courses)}
    />
  )
}
