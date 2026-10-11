import { User } from '@/domain/enterprise/entities/user'

/**
 * Formato do usuário devolvido pelo better-auth (sessão/login). Mantido local à
 * infraestrutura para que o resto do app não dependa do better-auth.
 */
export interface BetterAuthUser {
  id: string
  name: string
  email: string
  emailVerified?: boolean
  image?: string | null
  createdAt?: Date | string
}

/** Converte o usuário do better-auth em uma entidade de domínio. */
export function toDomainUser(dto: BetterAuthUser): User | null {
  const result = User.create(
    {
      name: dto.name,
      email: dto.email,
      emailVerified: dto.emailVerified,
      image: dto.image ?? null,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    },
    dto.id,
  )

  return result.isRight() ? result.value : null
}
