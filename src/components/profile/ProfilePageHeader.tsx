import Link from 'next/link'
import type { Role } from '@/domain/enterprise/entities/role'

const DASHBOARD_HREF: Record<Role, string> = {
  admin: '/admin',
  professor: '/professor',
  student: '/aluno',
}

export function ProfilePageHeader({ role }: { role: Role }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
      <Link
        href={DASHBOARD_HREF[role]}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
      >
        <i className="fi fi-rr-apps flex" aria-hidden="true" /> Voltar ao painel
      </Link>
    </div>
  )
}
