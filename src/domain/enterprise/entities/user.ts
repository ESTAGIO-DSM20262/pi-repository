import { type Either, left, right } from '@/core/either'
import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { InvalidInstitutionalEmailError } from '../errors/invalid-institutional-email-error'
import { InstitutionalEmail } from './institutional-email'
import type { Role } from './role'

interface UserProps {
  name: string
  email: InstitutionalEmail
  emailVerified: boolean
  image: string | null
  createdAt: Date
  role?: Role
}

interface CreateUserInput {
  name: string
  email: string | InstitutionalEmail
  emailVerified?: boolean
  image?: string | null
  createdAt?: Date
  role?: Role
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  get emailAddress() {
    return this.props.email.address
  }

  get role(): Role {
    return this.props.role ?? this.props.email.role
  }

  get emailVerified() {
    return this.props.emailVerified
  }

  get image() {
    return this.props.image
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    input: CreateUserInput,
    id?: UniqueEntityId | string,
  ): Either<InvalidInstitutionalEmailError, User> {
    let email: InstitutionalEmail

    if (input.email instanceof InstitutionalEmail) {
      email = input.email
    } else {
      const result = InstitutionalEmail.create(input.email)
      if (result.isLeft()) return left(result.value)
      email = result.value
    }

    const uniqueId = typeof id === 'string' ? new UniqueEntityId(id) : (id ?? new UniqueEntityId())

    const user = new User(
      {
        name: input.name,
        email,
        emailVerified: input.emailVerified ?? false,
        image: input.image ?? null,
        createdAt: input.createdAt ?? new Date(),
        role: input.role,
      },
      uniqueId,
    )

    return right(user)
  }
}
