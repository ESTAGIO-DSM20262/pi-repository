import { BackButton } from '@/components/ui/BackButton'
import type { Role } from '@/domain/enterprise/entities/role'
import { ROLE_DASHBOARD_PATH } from '@/presentation/auth/role-path'

export function ProfilePageHeader({ role }: { role: Role }) {
  return (
    <div className="mb-5 rounded-2xl border border-border bg-white p-3.5 shadow-sm sm:mb-6 sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <BackButton href={ROLE_DASHBOARD_PATH[role]} label="Voltar ao painel" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-primary">
            Conta do usuário
          </p>
          <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Meu perfil
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-sm">
            Consulte seus dados e mantenha suas informações atualizadas.
          </p>
        </div>
      </div>
    </div>
  )
}
