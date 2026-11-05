import type { ProjectViewer } from '@/application/projects/project-permissions'
import {
  awardCriteria,
  canChooseSemesterAward,
  isAwardEligible,
  recommendAwardCandidates,
} from '@/application/projects/semester-awards'
import { db } from '@/db'
import { projectVerifications, semesterAwards } from '@/db/schema'
import { DbProjectRepository } from './db-project-repository'

export async function listSemesterAwards(viewer: ProjectViewer) {
  const [projects, records, awards] = await Promise.all([
    new DbProjectRepository().findAll(),
    db.select().from(projectVerifications),
    db.select().from(semesterAwards),
  ])
  return recommendAwardCandidates(
    projects
      .filter((project) => project.active !== false || viewer.role === 'admin')
      .map((project) => {
        const criteria = awardCriteria(
          project,
          records
            .filter((record) => record.projectId === project.id)
            .map((record) => ({
              ...record,
              verifiedAt: record.verifiedAt.toISOString(),
            })),
        )
        const winner = awards.find(
          (award) => award.cycle === project.cycle && award.semester === project.semester,
        )
        return {
          project,
          criteria,
          score: criteria.length,
          recommended: false,
          canChoose: canChooseSemesterAward(project, viewer) && isAwardEligible(project),
          selected: winner?.projectId === project.id,
          winnerId: winner?.projectId ?? null,
          winnerTitle: projects.find((item) => item.id === winner?.projectId)?.title ?? null,
        }
      }),
  )
}
