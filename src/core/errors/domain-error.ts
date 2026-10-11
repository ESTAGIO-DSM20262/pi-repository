/**
 * Erro base do domínio. É uma `Error` para que possa ser lançado na fronteira
 * (ex.: componentes React) sem perder a mensagem exibível ao usuário.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}
