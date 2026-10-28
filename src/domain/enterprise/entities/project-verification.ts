import type { ProjectAdvisor } from './project'

export const VERIFICATION_CRITERIA = [
  {
    id: 'source_code',
    label: 'Código-fonte',
    statement: 'O código-fonte deste projeto serve como referência acadêmica.',
  },
  {
    id: 'documentation',
    label: 'Documentação',
    statement: 'A documentação deste projeto serve como referência acadêmica.',
  },
  {
    id: 'final_result',
    label: 'Resultado final',
    statement: 'O resultado final atende aos objetivos propostos para o projeto.',
  },
  {
    id: 'architecture',
    label: 'Arquitetura',
    statement: 'A arquitetura e a organização do sistema são boas referências para alunos futuros.',
  },
  {
    id: 'quality_tests',
    label: 'Testes e qualidade',
    statement: 'Os testes e as práticas de qualidade de software adotados são exemplares.',
  },
  {
    id: 'interface',
    label: 'Interface e usabilidade',
    statement: 'A interface e a experiência de uso são boas referências de design.',
  },
  {
    id: 'process',
    label: 'Processo de desenvolvimento',
    statement: 'O processo de desenvolvimento (tarefas, versões e entregas) está bem registrado.',
  },
] as const

export type VerificationCriterionId = (typeof VERIFICATION_CRITERIA)[number]['id']

export const VERIFICATION_CRITERION_IDS = VERIFICATION_CRITERIA.map(
  (criterion) => criterion.id,
) as VerificationCriterionId[]

export type VerifierRole = 'professor' | 'admin'

export interface ProjectVerificationRecord {
  verifierUserId: string
  verifierEmail: string
  verifierName: string
  verifierRole: VerifierRole
  criteria: VerificationCriterionId[]
  verifiedAt: string
}

export interface VerificationAdvisorStatus {
  email: string
  name: string
  verified: boolean
  verifiedAt: string | null
  criteria: VerificationCriterionId[]
}

export interface VerificationCriterionSummary {
  id: VerificationCriterionId
  label: string
  endorsedBy: number
  unanimous: boolean
}

export interface ProjectVerificationSummary {
  advisors: VerificationAdvisorStatus[]
  verifiedCount: number
  requiredCount: number
  complete: boolean
  criteria: VerificationCriterionSummary[]
  administrators: {
    email: string
    name: string
    verifiedAt: string
    criteria: VerificationCriterionId[]
  }[]
}

function normalize(email: string) {
  return email.trim().toLowerCase()
}

function isCriterionId(value: unknown): value is VerificationCriterionId {
  return VERIFICATION_CRITERION_IDS.includes(value as VerificationCriterionId)
}

export function normalizeVerificationCriteria(value: unknown): VerificationCriterionId[] {
  if (!Array.isArray(value)) return []
  const selected = new Set(value.filter(isCriterionId))
  return VERIFICATION_CRITERION_IDS.filter((id) => selected.has(id))
}

export function buildVerificationSummary(
  advisors: ProjectAdvisor[],
  records: ProjectVerificationRecord[],
): ProjectVerificationSummary {
  const professorRecords = new Map(
    records
      .filter((record) => record.verifierRole === 'professor')
      .map((record) => [normalize(record.verifierEmail), record]),
  )

  const advisorStatuses: VerificationAdvisorStatus[] = advisors.map((advisor) => {
    const record = professorRecords.get(normalize(advisor.email))
    return {
      email: normalize(advisor.email),
      name: advisor.name,
      verified: Boolean(record),
      verifiedAt: record?.verifiedAt ?? null,
      criteria: record?.criteria ?? [],
    }
  })

  const verifiedCount = advisorStatuses.filter((advisor) => advisor.verified).length
  const requiredCount = advisorStatuses.length
  const complete = requiredCount > 0 && verifiedCount === requiredCount

  const criteria = VERIFICATION_CRITERIA.map((criterion) => {
    const endorsedBy = advisorStatuses.filter((advisor) =>
      advisor.criteria.includes(criterion.id),
    ).length
    return {
      id: criterion.id,
      label: criterion.label,
      endorsedBy,
      unanimous: requiredCount > 0 && endorsedBy === requiredCount,
    }
  }).filter((criterion) => criterion.endorsedBy > 0)

  const administrators = records
    .filter((record) => record.verifierRole === 'admin')
    .map((record) => ({
      email: normalize(record.verifierEmail),
      name: record.verifierName,
      verifiedAt: record.verifiedAt,
      criteria: record.criteria,
    }))

  return {
    advisors: advisorStatuses,
    verifiedCount,
    requiredCount,
    complete,
    criteria,
    administrators,
  }
}

export function formatVerifiedCriteria(summary: ProjectVerificationSummary) {
  return summary.criteria.map((criterion) => criterion.label)
}
