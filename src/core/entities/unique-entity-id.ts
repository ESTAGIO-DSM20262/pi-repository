import { ValueObject } from './value-object'

/**
 * Identificador único de entidade. Usa a Web Crypto API (`globalThis.crypto`),
 * disponível tanto no browser quanto no Node — mantém o domínio isomórfico.
 */
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
