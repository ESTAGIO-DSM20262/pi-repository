import { ValueObject } from './value-object'

export class UniqueEntityId extends ValueObject<{ value: string }> {
  constructor(id?: string) {
    super({ value: id ?? globalThis.crypto.randomUUID() })
  }

  get value() {
    return this.props.value
  }

  toString() {
    return this.value
  }

  equals(other: UniqueEntityId) {
    return this.value === other.value
  }
}
