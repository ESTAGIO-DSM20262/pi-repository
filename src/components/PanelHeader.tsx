import type { Role } from '@/domain/enterprise/entities/role'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

interface PanelHeaderProps {
  name: string
  email: string
  role: Role
}

export default function PanelHeader({ name, email, role }: PanelHeaderProps) {
  return (
    <section className="mx-auto max-w-3xl p-6">
      <h2 className="text-2xl font-semibold">Olá, {name}</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Você entrou como <strong>{ROLE_LABEL[role]}</strong> ({email}).
      </p>
    </section>
  )
}
