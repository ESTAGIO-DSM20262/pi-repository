import type { Role } from '@/domain/enterprise/entities/role'
import { formatPersonName } from '@/libs/initials'
import { ROLE_LABEL } from '@/presentation/auth/role-label'

interface PanelHeaderProps {
  name: string
  email: string
  role: Role
}

export default function PanelHeader({ name, email, role }: PanelHeaderProps) {
  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-semibold">Olá, {formatPersonName(name)}</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Você entrou como <strong>{ROLE_LABEL[role]}</strong> ({email}).
        </p>
      </div>
    </section>
  )
}
