import type {
  ProjectDirectoryAccount,
  ProjectDirectoryPerson,
  ProjectUserDirectory,
} from '@/domain/enterprise/repositories/project-user-directory'

export class InMemoryProjectUserDirectory implements ProjectUserDirectory {
  constructor(
    private readonly accounts: ProjectDirectoryAccount[] = [],
    private readonly advisors: ProjectDirectoryPerson[] = [],
    private readonly students: ProjectDirectoryPerson[] = [],
  ) {}

  async findActiveAccountById(id: string) {
    return this.accounts.find((account) => account.id === id) ?? null
  }

  async findActiveAdvisorsByEmails(emails: string[]) {
    const requested = new Set(emails.map((email) => email.toLowerCase()))
    return this.advisors.filter((advisor) => requested.has(advisor.email.toLowerCase()))
  }

  async findActiveStudentsByEmails(emails: string[]) {
    const requested = new Set(emails.map((email) => email.toLowerCase()))
    return this.students.filter((student) => requested.has(student.email.toLowerCase()))
  }
}
