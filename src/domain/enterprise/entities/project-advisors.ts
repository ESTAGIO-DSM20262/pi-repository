import type { Project, ProjectAdvisor } from './project'

export const MAX_PROJECT_ADVISORS = 5

function normalize(email: string) {
  return email.trim().toLowerCase()
}

export function getProjectAdvisors(project: Pick<Project, 'advisor' | 'coAdvisors'>) {
  const seen = new Set<string>()
  const advisors: ProjectAdvisor[] = []
  for (const advisor of [project.advisor, ...(project.coAdvisors ?? [])]) {
    const key = normalize(advisor.email)
    if (seen.has(key)) continue
    seen.add(key)
    advisors.push(advisor)
  }
  return advisors
}

export function isProjectAdvisor(project: Pick<Project, 'advisor' | 'coAdvisors'>, email: string) {
  const key = normalize(email)
  return getProjectAdvisors(project).some((advisor) => normalize(advisor.email) === key)
}

export function isProjectActive(project: Pick<Project, 'active'>) {
  return project.active !== false
}
