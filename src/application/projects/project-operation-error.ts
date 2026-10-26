import { DomainError } from '@/core/errors/domain-error'

export class ProjectOperationError extends DomainError {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
