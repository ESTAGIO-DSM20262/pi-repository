import { type Either, left, right } from '@/core/either'
import { ValueObject } from '@/core/entities/value-object'
import { InvalidEmailError } from '../errors/invalid-email-error'

interface EmailAddressProps {
  address: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class EmailAddress extends ValueObject<EmailAddressProps> {
  private constructor(props: EmailAddressProps) {
    super(props)
  }

  get address() {
    return this.props.address
  }

  equals(other: EmailAddress) {
    return this.address === other.address
  }

  static create(raw: string): Either<InvalidEmailError, EmailAddress> {
    const normalized = (raw ?? '').trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalized)) return left(new InvalidEmailError(raw))
    return right(new EmailAddress({ address: normalized }))
  }

  static isValid(raw: string): boolean {
    return EmailAddress.create(raw).isRight()
  }
}
