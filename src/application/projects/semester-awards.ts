import type { Project } from '@/domain/enterprise/entities/project'
import { getProjectAdvisors } from '@/domain/enterprise/entities/project-advisors'
import {
  normalizeVerificationCriteria,
  type ProjectVerificationRecord,
} from '@/domain/enterprise/entities/project-verification'
import { isPrincipalAdvisorOf, type ProjectViewer } from './project-permissions'

export function canChooseSemesterAward(project: Project, viewer: ProjectViewer) {
  return viewer.role === 'admin' || isPrincipalAdvisorOf(project, viewer)
}

export function isAwardEligible(project: Project) {
  return project.active !== false && project.status === 'publicado'
}

export function awardCriteria(project: Project, records: ProjectVerificationRecord[]) {
  const advisors = new Set(getProjectAdvisors(project).map((a) => a.email.trim().toLowerCase()))
  return normalizeVerificationCriteria(
    records
      .filter(
        (record) =>
          record.verifierRole === 'professor' &&
          advisors.has(record.verifierEmail.trim().toLowerCase()),
      )
      .flatMap((record) => record.criteria),
  )
}

export interface AwardCandidate {
  project: Project
  criteria: ReturnType<typeof awardCriteria>
  score: number
  recommended: boolean
  canChoose: boolean
  selected: boolean
  winnerId: string | null
  winnerTitle: string | null
}

export function recommendAwardCandidates(candidates: AwardCandidate[]) {
  return candidates.map((candidate) => {
    const peers = candidates.filter(
      (other) =>
        other.project.cycle === candidate.project.cycle &&
        other.project.semester === candidate.project.semester &&
        isAwardEligible(other.project),
    )
    const highest = Math.max(0, ...peers.map((other) => other.score))
    return {
      ...candidate,
      recommended: isAwardEligible(candidate.project) && highest > 0 && candidate.score === highest,
    }
  })
}

export function sortAwardCandidates(candidates: AwardCandidate[]) {
  return [...candidates].sort(
    (a, b) =>
      Number(b.selected) - Number(a.selected) ||
      Number(isAwardEligible(b.project)) - Number(isAwardEligible(a.project)) ||
      b.score - a.score ||
      a.project.title.localeCompare(b.project.title, 'pt-BR'),
  )
}

export function summarizeAwardGroup(candidates: AwardCandidate[]) {
  const recommended = candidates.filter((item) => item.recommended)
  return {
    winnerTitle: candidates.find((item) => item.winnerTitle)?.winnerTitle ?? null,
    recommended,
    highestScore: recommended[0]?.score ?? 0,
    eligibleCount: candidates.filter((item) => isAwardEligible(item.project)).length,
  }
}
