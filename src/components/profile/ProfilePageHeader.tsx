import { BackButton } from '@/components/ui/BackButton'
import type { Role } from '@/domain/enterprise/entities/role'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'

export function ProfilePageHeader({ role }: { role: Role }) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <BackButton href={ROLE_DASHBOARD_PATH[role]} label="Voltar ao painel" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Conta do usuário
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Meu perfil
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Consulte seus dados e mantenha suas informações atualizadas.
          </p>
        </div>
      </div>
    </div>
  )
}
