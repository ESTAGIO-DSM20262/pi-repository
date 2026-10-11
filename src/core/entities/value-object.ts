export abstract class ValueObject<Props> {
  protected readonly props: Props

  protected constructor(props: Props) {
    this.props = props
  }
}
