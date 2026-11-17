import { type Either, left, right } from '@/core/either'
import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { InvalidEmailError } from '../errors/invalid-email-error'
import { EmailAddress } from './email-address'
import type { Role } from './role'

interface UserProps {
  name: string
  email: EmailAddress
  emailVerified: boolean
  image: string | null
  createdAt: Date
  role: Role
}

interface CreateUserInput {
  name: string
  email: string | EmailAddress
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
    return this.props.role
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
  ): Either<InvalidEmailError, User> {
    let email: EmailAddress

    if (input.email instanceof EmailAddress) {
      email = input.email
    } else {
      const result = EmailAddress.create(input.email)
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
        role: input.role ?? 'student',
      },
      uniqueId,
    )

    return right(user)
  }
}
