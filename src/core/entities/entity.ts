import { UniqueEntityId } from './unique-entity-id'

export abstract class Entity<Props> {
  private readonly _id: UniqueEntityId
  protected readonly props: Props

  get id() {
    return this._id
  }

  protected constructor(props: Props, id?: UniqueEntityId) {
    this.props = props
    this._id = id ?? new UniqueEntityId()
  }

  equals(other: Entity<Props>) {
    return this._id.equals(other._id)
  }
}
