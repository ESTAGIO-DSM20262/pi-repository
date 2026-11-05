import { describe, expect, it } from 'vitest'
import type { Project } from '@/domain/enterprise/entities/project'
import type { ProjectVerificationRecord } from '@/domain/enterprise/entities/project-verification'
import { InMemoryProjectReader } from '@/test/repositories/in-memory-project-reader'
import { ChooseSemesterAward } from './choose-semester-award'
import {
  type AwardCandidate,
  awardCriteria,
  canChooseSemesterAward,
  isAwardEligible,
  recommendAwardCandidates,
} from './semester-awards'

const principal = {
  id: 'p1',
  name: 'Principal',
  email: 'Principal@fatec.br',
  role: 'professor' as const,
}
const satellite = { ...principal, id: 'p2', email: 'satellite@fatec.br' }
const admin = { ...principal, id: 'a1', role: 'admin' as const }
const student = { ...principal, role: 'student' as const }
const project: Project = {
  id: 'p',
  title: 'Projeto',
  summary: '',
  cycle: '2026-2',
  semester: 2,
  advisor: { email: 'principal@fatec.br', name: 'Principal' },
  coAdvisors: [{ email: satellite.email, name: 'Satélite' }],
  memberEmails: [],
  languages: [],
  stack: [],
  theme: '',
  status: 'publicado',
  verified: false,
  cover: { icon: '', label: '', tone: 'blue' },
}
function record(
  email: string,
  criteria: ProjectVerificationRecord['criteria'],
  role: ProjectVerificationRecord['verifierRole'] = 'professor',
): ProjectVerificationRecord {
  return {
    verifierUserId: email,
    verifierEmail: email,
    verifierName: email,
    verifierRole: role,
    criteria,
    verifiedAt: '2026-11-05',
  }
}
function candidate(id: string, score: number, overrides: Partial<Project> = {}): AwardCandidate {
  return {
    project: { ...project, id, ...overrides },
    score,
    criteria: [],
    recommended: false,
    canChoose: true,
    selected: false,
    winnerId: null,
    winnerTitle: null,
  }
}

describe('melhor PI do semestre', () => {
  it('autoriza somente principal e admin, mesmo que o aluno use o email do principal', () => {
    expect(canChooseSemesterAward(project, principal)).toBe(true)
    expect(canChooseSemesterAward(project, admin)).toBe(true)
    expect(canChooseSemesterAward(project, satellite)).toBe(false)
    expect(canChooseSemesterAward(project, student)).toBe(false)
    expect(canChooseSemesterAward(project, { ...principal, email: 'outro@fatec.br' })).toBe(false)
  })
  it('conta critérios distintos e ignora indicações de professores removidos do projeto', () => {
    expect(
      awardCriteria(project, [
        record(principal.email, ['documentation', 'source_code']),
        record(satellite.email, ['documentation']),
        record('antigo@fatec.br', ['process']),
        record(admin.email, ['interface'], 'admin'),
      ]),
    ).toEqual(['source_code', 'documentation', 'interface'])
  })
  it('recomenda todos os empatados e separa semestres e ciclos', () => {
    const result = recommendAwardCandidates([
      candidate('a', 2),
      candidate('b', 2),
      candidate('c', 1),
      candidate('d', 1, { cycle: '2025-2' }),
      candidate('e', 1, { semester: 3 }),
      candidate('f', 7, { active: false }),
      candidate('g', 7, { status: 'em_andamento' }),
    ])
    expect(result.filter((item) => item.recommended).map((item) => item.project.id)).toEqual([
      'a',
      'b',
      'd',
      'e',
    ])
  })
  it('não recomenda automaticamente quando nenhum critério foi atendido', () => {
    expect(recommendAwardCandidates([candidate('a', 0)])[0].recommended).toBe(false)
    expect(isAwardEligible({ ...project, active: false })).toBe(false)
  })
  it('permite decisão manual sem indicação e bloqueia escritas não autorizadas', async () => {
    let saves = 0
    const useCase = new ChooseSemesterAward(new InMemoryProjectReader([project]), {
      choose: async () => {
        saves++
        return true
      },
      remove: async () => true,
    })
    for (const viewer of [satellite, student, { ...principal, email: 'outro@fatec.br' }]) {
      const result = await useCase.execute({
        viewer,
        projectId: project.id,
        expectedWinnerId: null,
      })
      expect(result.isLeft()).toBe(true)
    }
    expect(saves).toBe(0)
    expect(
      (
        await useCase.execute({ viewer: principal, projectId: project.id, expectedWinnerId: null })
      ).isRight(),
    ).toBe(true)
    expect(saves).toBe(1)
  })
  it('rejeita projetos inexistentes, inativos e em andamento', async () => {
    const useCase = new ChooseSemesterAward(
      new InMemoryProjectReader([
        { ...project, id: 'inactive', active: false },
        { ...project, id: 'ongoing', status: 'em_andamento' },
      ]),
      {
        choose: async () => {
          throw new Error('Não deve gravar')
        },
        remove: async () => false,
      },
    )
    for (const projectId of ['missing', 'inactive', 'ongoing']) {
      expect(
        (await useCase.execute({ viewer: admin, projectId, expectedWinnerId: null })).isLeft(),
      ).toBe(true)
    }
  })
  it('reporta conflitos de atualização e permite retirar a escolha', async () => {
    const useCase = new ChooseSemesterAward(new InMemoryProjectReader([project]), {
      choose: async () => false,
      remove: async () => true,
    })
    const result = await useCase.execute({
      viewer: admin,
      projectId: project.id,
      expectedWinnerId: 'antigo',
    })
    expect(result.isLeft() && result.value.status).toBe(409)
    expect(
      (
        await useCase.execute({
          viewer: principal,
          projectId: project.id,
          expectedWinnerId: project.id,
          remove: true,
        })
      ).isRight(),
    ).toBe(true)
    expect(
      (
        await useCase.execute({
          viewer: satellite,
          projectId: project.id,
          expectedWinnerId: project.id,
          remove: true,
        })
      ).isLeft(),
    ).toBe(true)
  })
})
