/**
 * Base para value objects. Um value object é imutável e definido pelos seus
 * atributos (não por identidade). Camada de domínio: não depende de framework.
 */
export abstract class ValueObject<Props> {
  protected readonly props: Props

  protected constructor(props: Props) {
    this.props = props
  }
}
