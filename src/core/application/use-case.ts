/**
 * Contrato de caso de uso. Casos de uso orquestram o domínio e dependem apenas
 * de portas (interfaces) — nunca de React, Next, better-auth ou Drizzle.
 */
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>
}
