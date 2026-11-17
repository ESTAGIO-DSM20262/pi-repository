export type UserAuditAction = 'created' | 'updated' | 'activated' | 'deactivated'

export interface UserAuditChange {
  field: string
  label: string
  from: string | null
  to: string | null
}

export interface UserAuditFact {
  label: string
  value: string
}

export interface UserAuditDetails {
  changes?: UserAuditChange[]
  facts?: UserAuditFact[]
  note?: string
}

export interface UserAuditEvent {
  id: string
  userId: string
  actorId: string | null
  actorName: string
  action: UserAuditAction
  summary: string
  details: UserAuditDetails
  createdAt: string
}
